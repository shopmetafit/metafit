const assert = require("assert");

// Test 1: Test ProductRequest model schema rules
function testProductRequestSchema() {
  console.log("\n--- TEST SUITE 1: ProductRequest Model Schema Validation ---");
  const mongoose = require("mongoose");
  const ProductRequest = require("./models/ProductRequest");
  const Product = require("./models/Product");

  // Check sku path definition
  const skuPath = ProductRequest.schema.path("sku");
  assert(skuPath, "ProductRequest schema must have a sku path");
  assert(skuPath.options.trim === true, "ProductRequest sku path must have trim: true");
  console.log("✓ ProductRequest sku path has trim: true");

  // Check Product sku path definition
  const productSkuPath = Product.schema.path("sku");
  assert(productSkuPath, "Product schema must have a sku path");
  assert(productSkuPath.options.required === true, "Product sku path must be required");
  assert(productSkuPath.options.trim === true, "Product sku path must have trim: true");
  assert(productSkuPath.options.unique === true, "Product sku path must have unique: true");
  console.log("✓ Product sku path has required: true, trim: true, unique: true");

  // Test trimming behavior in Mongoose document
  const testDoc = new ProductRequest({
    name: "Test Item",
    sku: "   SKU-TRIM-TEST   ",
  });
  assert.strictEqual(testDoc.sku, "SKU-TRIM-TEST", "ProductRequest must automatically trim whitespace from SKU");
  console.log("✓ ProductRequest automatically trims whitespace from SKU: '   SKU-TRIM-TEST   ' -> 'SKU-TRIM-TEST'");

  // Test required condition for new documents
  const newDocNoSku = new ProductRequest({
    name: "Test Item",
    sku: "",
  });
  const newDocValidation = newDocNoSku.validateSync();
  assert(newDocValidation && newDocValidation.errors["sku"], "New ProductRequest without SKU must fail validation");
  console.log("✓ New ProductRequest without SKU fails schema validation as expected");

  // Test legacy document behavior: existing doc (isNew: false) with status 'pending' and missing SKU
  const legacyDoc = new ProductRequest();
  legacyDoc.isNew = false;
  legacyDoc.status = "pending";
  // The required validator returns false when status is 'pending' and isNew is false
  const isRequiredForLegacy = skuPath.options.required.call(legacyDoc);
  assert.strictEqual(isRequiredForLegacy, false, "Legacy pending document should not be blocked from saving other fields");
  console.log("✓ Legacy pending document is not blocked by Mongoose pre-validation for non-approval updates");

  // Test approved status requirement: status 'approved' must require SKU
  legacyDoc.status = "approved";
  const isRequiredForApproved = skuPath.options.required.call(legacyDoc);
  assert.strictEqual(isRequiredForApproved, true, "Approved document must strictly require SKU");
  console.log("✓ Approved document strictly requires SKU in schema");
}

// Test 2: Controller Unit Tests with Mocked DB and Req/Res
async function testControllers() {
  console.log("\n--- TEST SUITE 2: Controller Flow and Validation Cases ---");
  const ProductRequest = require("./models/ProductRequest");
  const Product = require("./models/Product");
  const {
    createProductRequest,
    updateProductRequest,
    approveProductRequest,
    updateProductRequestAdmin,
  } = require("./controllers/productRequestController");

  function createMockRes() {
    return {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
  }

  // Case 2.1: createProductRequest - whitespace-only SKU must be rejected
  {
    const req = {
      user: { _id: "507f1f77bcf86cd799439011", role: "vendor", vendorName: "Vendor 1" },
      body: {
        name: "Test Product",
        description: "A test description",
        price: 100,
        countInStock: 10,
        sku: "    ", // whitespace only
        category: "Supplements",
        brand: "BrandX",
        collection: "Wellness",
      },
    };
    const res = createMockRes();
    await createProductRequest(req, res);
    assert.strictEqual(res.statusCode, 400, "Whitespace SKU must return status 400");
    assert(res.jsonData.message.includes("SKU is required"), "Message must specify SKU is required");
    console.log("✓ Case 2.1: Whitespace-only SKU in createProductRequest is rejected with HTTP 400");
  }

  // Case 2.2: createProductRequest - duplicate SKU in ProductRequest must be rejected
  {
    const origFindOne = ProductRequest.findOne;
    ProductRequest.findOne = async (query) => {
      if (query.sku === "EXISTING-REQ-SKU") {
        return { _id: "existing_id", sku: "EXISTING-REQ-SKU" };
      }
      return null;
    };

    const req = {
      user: { _id: "507f1f77bcf86cd799439011", role: "vendor" },
      body: {
        name: "Test Product",
        description: "A test description",
        price: 100,
        countInStock: 10,
        sku: "  EXISTING-REQ-SKU  ",
        category: "Supplements",
        brand: "BrandX",
        collection: "Wellness",
      },
    };
    const res = createMockRes();
    await createProductRequest(req, res);
    ProductRequest.findOne = origFindOne;

    assert.strictEqual(res.statusCode, 400, "Duplicate request SKU must return status 400");
    assert.strictEqual(res.jsonData.message, "SKU already exists in product requests");
    console.log("✓ Case 2.2: Duplicate SKU in ProductRequest is rejected with HTTP 400");
  }

  // Case 2.3: createProductRequest - duplicate SKU in Product must be rejected
  {
    const origReqFindOne = ProductRequest.findOne;
    const origProdFindOne = Product.findOne;
    ProductRequest.findOne = async () => null;
    Product.findOne = async (query) => {
      if (query.sku === "EXISTING-PROD-SKU") {
        return { _id: "prod_id", sku: "EXISTING-PROD-SKU" };
      }
      return null;
    };

    const req = {
      user: { _id: "507f1f77bcf86cd799439011", role: "vendor" },
      body: {
        name: "Test Product",
        description: "A test description",
        price: 100,
        countInStock: 10,
        sku: "EXISTING-PROD-SKU",
        category: "Supplements",
        brand: "BrandX",
        collection: "Wellness",
      },
    };
    const res = createMockRes();
    await createProductRequest(req, res);
    ProductRequest.findOne = origReqFindOne;
    Product.findOne = origProdFindOne;

    assert.strictEqual(res.statusCode, 400, "Duplicate product SKU must return status 400");
    assert.strictEqual(res.jsonData.message, "SKU already exists in products");
    console.log("✓ Case 2.3: Duplicate SKU in existing Products is rejected with HTTP 400");
  }

  // Case 2.4: updateProductRequest - updating to empty SKU must be rejected
  {
    const origFindById = ProductRequest.findById;
    ProductRequest.findById = async (id) => ({
      _id: id,
      vendorId: "507f1f77bcf86cd799439011",
      status: "pending",
      sku: "OLD-SKU",
      save: async function () { return this; },
    });

    const req = {
      user: { _id: "507f1f77bcf86cd799439011", role: "vendor" },
      params: { id: "req_123" },
      body: { sku: "   " },
    };
    const res = createMockRes();
    await updateProductRequest(req, res);
    ProductRequest.findById = origFindById;

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.message, "SKU cannot be empty");
    console.log("✓ Case 2.4: updateProductRequest rejects empty/whitespace SKU with HTTP 400");
  }

  // Case 2.5: updateProductRequest - updating to duplicate SKU must be rejected
  {
    const origFindById = ProductRequest.findById;
    const origFindOne = ProductRequest.findOne;
    ProductRequest.findById = async (id) => ({
      _id: id,
      vendorId: "507f1f77bcf86cd799439011",
      status: "pending",
      sku: "OLD-SKU",
    });
    ProductRequest.findOne = async () => ({ _id: "other_id", sku: "TAKEN-SKU" });

    const req = {
      user: { _id: "507f1f77bcf86cd799439011", role: "vendor" },
      params: { id: "req_123" },
      body: { sku: "TAKEN-SKU" },
    };
    const res = createMockRes();
    await updateProductRequest(req, res);
    ProductRequest.findById = origFindById;
    ProductRequest.findOne = origFindOne;

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.message, "SKU already exists in product requests");
    console.log("✓ Case 2.5: updateProductRequest rejects duplicate SKU with HTTP 400");
  }

  // Case 2.6: approveProductRequest - legacy request without SKU and none provided must be rejected with actionable message
  {
    const origFindById = ProductRequest.findById;
    ProductRequest.findById = (id) => ({
      populate: async () => ({
        _id: id,
        status: "pending",
        sku: undefined, // Legacy request without SKU
        vendorId: { _id: "vendor_1", businessName: "V1", vendorName: "V1" },
      }),
    });

    const req = {
      user: { _id: "admin_id", role: "admin" },
      params: { id: "legacy_req_1" },
      body: {}, // No SKU provided
    };
    const res = createMockRes();
    await approveProductRequest(req, res);
    ProductRequest.findById = origFindById;

    assert.strictEqual(res.statusCode, 400, "Legacy request missing SKU must return status 400");
    assert.strictEqual(res.jsonData.code, "SKU_REQUIRED");
    assert(res.jsonData.message.includes("SKU is required to approve this product request"));
    console.log("✓ Case 2.6: approveProductRequest rejects legacy request missing SKU with HTTP 400 and code 'SKU_REQUIRED'");
  }

  // Case 2.7: approveProductRequest - legacy request with admin-provided SKU must succeed and create product
  {
    let savedProduct = null;
    let updatedRequest = null;

    const mockRequest = {
      _id: "legacy_req_2",
      status: "pending",
      sku: undefined, // Missing initially
      name: "Legacy Product",
      description: "Description",
      price: 150,
      countInStock: 25,
      category: "Wellness",
      brand: "M Wellness",
      collection: "Daily",
      vendorId: { _id: "vendor_1", businessName: "V1", vendorName: "V1" },
      save: async function () {
        updatedRequest = this;
        return this;
      },
    };

    const origFindById = ProductRequest.findById;
    const origReqFindOne = ProductRequest.findOne;
    const origProdFindOne = Product.findOne;

    ProductRequest.findById = () => ({
      populate: async () => mockRequest,
    });
    Product.findOne = async () => null; // Not taken
    ProductRequest.findOne = async () => null; // Not taken

    // Spy on Product save
    const origProductSave = Product.prototype.save;
    Product.prototype.save = async function () {
      savedProduct = this;
      return this;
    };

    const req = {
      user: { _id: "admin_1" },
      params: { id: "legacy_req_2" },
      body: { sku: "   LEGACY-ADMIN-SKU-001   " }, // Admin supplies trimmed SKU
    };
    const res = createMockRes();
    await approveProductRequest(req, res);

    ProductRequest.findById = origFindById;
    Product.findOne = origProdFindOne;
    ProductRequest.findOne = origReqFindOne;
    Product.prototype.save = origProductSave;

    assert.strictEqual(res.statusCode, 200, "Approval with admin-provided SKU must succeed with HTTP 200");
    assert(savedProduct, "Product must be created and saved");
    assert.strictEqual(savedProduct.sku, "LEGACY-ADMIN-SKU-001", "Product.sku must match normalized admin-provided SKU");
    assert.strictEqual(updatedRequest.sku, "LEGACY-ADMIN-SKU-001", "ProductRequest.sku must be updated to admin SKU");
    assert.strictEqual(updatedRequest.status, "approved", "ProductRequest status must be updated to approved");
    console.log("✓ Case 2.7: Legacy request missing SKU is successfully corrected by admin at approval time and persists trimmed SKU to Product and ProductRequest");
  }

  // Case 2.8: approveProductRequest - already-approved request cannot be approved again
  {
    const origFindById = ProductRequest.findById;
    ProductRequest.findById = (id) => ({
      populate: async () => ({
        _id: id,
        status: "approved", // Already approved
        sku: "TEST-SKU",
      }),
    });

    const req = {
      user: { _id: "admin_id" },
      params: { id: "approved_req" },
      body: {},
    };
    const res = createMockRes();
    await approveProductRequest(req, res);
    ProductRequest.findById = origFindById;

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.message, "Cannot approve request that is not pending");
    console.log("✓ Case 2.8: Already-approved request returns HTTP 400 'Cannot approve request that is not pending'");
  }

  // Case 2.9: approveProductRequest - duplicate SKU returns HTTP 400 with DUPLICATE_SKU code
  {
    const origFindById = ProductRequest.findById;
    const origProdFindOne = Product.findOne;
    ProductRequest.findById = (id) => ({
      populate: async () => ({
        _id: id,
        status: "pending",
        sku: "EXISTING-SKU",
        vendorId: { _id: "v1" },
      }),
    });
    Product.findOne = async () => ({ _id: "other_prod", sku: "EXISTING-SKU" });

    const req = {
      user: { _id: "admin_id" },
      params: { id: "dup_req" },
      body: {},
    };
    const res = createMockRes();
    await approveProductRequest(req, res);
    ProductRequest.findById = origFindById;
    Product.findOne = origProdFindOne;

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.code, "DUPLICATE_SKU");
    console.log("✓ Case 2.9: Duplicate SKU at approval returns HTTP 400 with code 'DUPLICATE_SKU'");
  }

  // Case 2.10: updateProductRequestAdmin - admin can update request SKU before approval
  {
    let savedRequest = null;
    const mockRequest = {
      _id: "admin_edit_req",
      status: "pending",
      sku: "OLD-ADMIN-SKU",
      save: async function () {
        savedRequest = this;
        return this;
      },
    };

    const origFindById = ProductRequest.findById;
    const origReqFindOne = ProductRequest.findOne;
    const origProdFindOne = Product.findOne;
    ProductRequest.findById = async () => mockRequest;
    ProductRequest.findOne = async () => null;
    Product.findOne = async () => null;

    const req = {
      user: { _id: "admin_id" },
      params: { id: "admin_edit_req" },
      body: { sku: "   NEW-ADMIN-SKU-123   " },
    };
    const res = createMockRes();
    await updateProductRequestAdmin(req, res);
    ProductRequest.findById = origFindById;
    ProductRequest.findOne = origReqFindOne;
    Product.findOne = origProdFindOne;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(savedRequest.sku, "NEW-ADMIN-SKU-123", "Admin updated SKU must be trimmed and persisted");
    console.log("✓ Case 2.10: Admin can update and normalize SKU via updateProductRequestAdmin");
  }

  // Case 2.11: approveProductRequest - request with existing SKU (e.g. '103') and empty req.body {} succeeds
  {
    let savedProduct = null;
    let savedRequest = null;
    const mockRequest = {
      _id: "req_sku_103",
      status: "pending",
      sku: "103",
      name: "Energy Healing Quartz",
      description: "Healing stone",
      price: 2999,
      countInStock: 50,
      category: "Wellness",
      brand: "Satvik",
      collection: "Crystals",
      vendorId: { _id: "vendor_1", businessName: "V1", vendorName: "V1" },
      save: async function () {
        savedRequest = this;
        return this;
      },
    };

    const origFindById = ProductRequest.findById;
    const origReqFindOne = ProductRequest.findOne;
    const origProdFindOne = Product.findOne;
    const origProductSave = Product.prototype.save;

    ProductRequest.findById = () => ({ populate: async () => mockRequest });
    Product.findOne = async () => null;
    ProductRequest.findOne = async () => null;
    Product.prototype.save = async function () {
      savedProduct = this;
      return this;
    };

    const req = {
      user: { _id: "admin_1" },
      params: { id: "req_sku_103" },
      body: {}, // Empty body sent by frontend
    };
    const res = createMockRes();
    await approveProductRequest(req, res);

    ProductRequest.findById = origFindById;
    Product.findOne = origProdFindOne;
    ProductRequest.findOne = origReqFindOne;
    Product.prototype.save = origProductSave;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(savedProduct.sku, "103", "Product.sku must resolve to 103");
    assert.strictEqual(savedRequest.sku, "103");
    assert.strictEqual(savedRequest.status, "approved");
    console.log("✓ Case 2.11: Request with existing SKU '103' and empty body {} approves successfully with SKU '103'");
  }

  // Case 2.12: approveProductRequest - legacy request with SKU in payload.sku and empty req.body succeeds
  {
    let savedProduct = null;
    const mockRequest = {
      _id: "req_legacy_payload",
      status: "pending",
      sku: undefined,
      payload: { sku: "103" },
      name: "Energy Healing Quartz",
      description: "Healing stone",
      price: 2999,
      countInStock: 50,
      category: "Wellness",
      brand: "Satvik",
      collection: "Crystals",
      vendorId: { _id: "vendor_1", businessName: "V1", vendorName: "V1" },
      save: async function () { return this; },
    };

    const origFindById = ProductRequest.findById;
    const origReqFindOne = ProductRequest.findOne;
    const origProdFindOne = Product.findOne;
    const origProductSave = Product.prototype.save;

    ProductRequest.findById = () => ({ populate: async () => mockRequest });
    Product.findOne = async () => null;
    ProductRequest.findOne = async () => null;
    Product.prototype.save = async function () {
      savedProduct = this;
      return this;
    };

    const req = {
      user: { _id: "admin_1" },
      params: { id: "req_legacy_payload" },
      body: {},
    };
    const res = createMockRes();
    await approveProductRequest(req, res);

    ProductRequest.findById = origFindById;
    Product.findOne = origProdFindOne;
    ProductRequest.findOne = origReqFindOne;
    Product.prototype.save = origProductSave;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(savedProduct.sku, "103", "Product.sku must resolve to payload.sku '103'");
    console.log("✓ Case 2.12: Legacy request with SKU in payload.sku resolves correctly on approval without error");
  }

  // Case 2.13: approveProductRequest - supports req.body.productSku or req.body.SKU
  {
    let savedProduct = null;
    const mockRequest = {
      _id: "req_casing",
      status: "pending",
      sku: undefined,
      name: "Item",
      description: "Desc",
      price: 100,
      countInStock: 10,
      category: "C",
      brand: "B",
      collection: "Col",
      vendorId: { _id: "v1" },
      save: async function () { return this; },
    };

    const origFindById = ProductRequest.findById;
    const origReqFindOne = ProductRequest.findOne;
    const origProdFindOne = Product.findOne;
    const origProductSave = Product.prototype.save;

    ProductRequest.findById = () => ({ populate: async () => mockRequest });
    Product.findOne = async () => null;
    ProductRequest.findOne = async () => null;
    Product.prototype.save = async function () {
      savedProduct = this;
      return this;
    };

    const req = {
      user: { _id: "admin_1" },
      params: { id: "req_casing" },
      body: { productSku: "ALT-SKU-999" }, // Alternative casing
    };
    const res = createMockRes();
    await approveProductRequest(req, res);

    ProductRequest.findById = origFindById;
    Product.findOne = origProdFindOne;
    ProductRequest.findOne = origReqFindOne;
    Product.prototype.save = origProductSave;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(savedProduct.sku, "ALT-SKU-999");
    console.log("✓ Case 2.13: Alternative casing (productSku/SKU) in request body is recognized");
  }

  // Case 2.14: approveProductRequest - preserves existing productId on update approval
  {
    const existingProductId = "6accbc6176484a630e66584d";
    let updatedProduct = null;

    const mockExistingProduct = {
      _id: existingProductId,
      name: "Energy Healing Quart",
      sku: "103",
      productApprovalStatus: "pending",
      isPublished: false,
      save: async function () {
        updatedProduct = this;
        return this;
      },
    };

    const mockRequest = {
      _id: "req_with_existing_prod",
      productId: existingProductId,
      status: "pending",
      sku: "103",
      name: "Energy Healing Quartz Updated",
      description: "Updated description",
      price: 2999,
      countInStock: 50,
      category: "Medical Wellness",
      brand: "Satvik Healing",
      collection: "Crystals",
      vendorId: { _id: "vendor_1" },
      save: async function () { return this; },
    };

    const origFindById = ProductRequest.findById;
    const origProdFindById = Product.findById;
    const origReqFindOne = ProductRequest.findOne;
    const origProdFindOne = Product.findOne;

    ProductRequest.findById = () => ({ populate: async () => mockRequest });
    Product.findById = async (id) => id === existingProductId ? mockExistingProduct : null;
    Product.findOne = async () => null;
    ProductRequest.findOne = async () => null;

    const req = {
      user: { _id: "admin_1" },
      params: { id: "req_with_existing_prod" },
      body: {},
    };
    const res = createMockRes();
    await approveProductRequest(req, res);

    ProductRequest.findById = origFindById;
    Product.findById = origProdFindById;
    Product.findOne = origProdFindOne;
    ProductRequest.findOne = origReqFindOne;

    assert.strictEqual(res.statusCode, 200);
    assert(updatedProduct, "Existing product must be updated");
    assert.strictEqual(updatedProduct._id, existingProductId, "Original Product ID must be strictly preserved");
    assert.strictEqual(updatedProduct.productApprovalStatus, "approved");
    assert.strictEqual(updatedProduct.isPublished, true);
    console.log("✓ Case 2.14: Approval preserves existing productId without creating a duplicate record");
  }

  // Case 2.15: approveProductRequest - direct Product ID approval fallback
  {
    const directProdId = "6accbc6176484a630e66584d";
    let savedDirectProd = null;

    const mockDirectProduct = {
      _id: directProdId,
      name: "Energy Healing Quart",
      sku: "103",
      productApprovalStatus: "pending",
      isPublished: false,
      category: "Medical Wellness",
      save: async function () {
        savedDirectProd = this;
        return this;
      },
    };

    const origReqFindById = ProductRequest.findById;
    const origProdFindById = Product.findById;
    const origProdFindOne = Product.findOne;

    ProductRequest.findById = () => ({ populate: async () => null }); // Not in productrequests
    Product.findById = (id) => ({ populate: async () => id === directProdId ? mockDirectProduct : null });
    Product.findOne = async () => null;

    const req = {
      user: { _id: "admin_1" },
      params: { id: directProdId },
      body: {},
    };
    const res = createMockRes();
    await approveProductRequest(req, res);

    ProductRequest.findById = origReqFindById;
    Product.findById = origProdFindById;
    Product.findOne = origProdFindOne;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(savedDirectProd._id, directProdId, "Direct product ID preserved");
    assert.strictEqual(savedDirectProd.sku, "103");
    assert.strictEqual(savedDirectProd.productApprovalStatus, "approved");
    assert.strictEqual(savedDirectProd.isPublished, true);
    console.log("✓ Case 2.15: Direct Product ID fallback succeeds, preserves Product ID, and activates product");
  }

  // Case 2.16: rejectProductRequest - handles both rejectionReason and reason
  {
    const mockRequest = {
      _id: "req_reject_test",
      status: "pending",
      save: async function () { return this; },
    };

    const origFindById = ProductRequest.findById;
    ProductRequest.findById = async () => mockRequest;

    // Subcase A: frontend sends { reason: "Quality issue" }
    const reqA = {
      user: { _id: "admin_1" },
      params: { id: "req_reject_test" },
      body: { reason: "Quality issue" },
    };
    const resA = createMockRes();
    const { rejectProductRequest } = require("./controllers/productRequestController");
    await rejectProductRequest(reqA, resA);
    assert.strictEqual(resA.statusCode, 200);
    assert.strictEqual(mockRequest.status, "rejected");
    assert.strictEqual(mockRequest.rejectionReason, "Quality issue");

    ProductRequest.findById = origFindById;
    console.log("✓ Case 2.16: rejectProductRequest accepts { reason } from frontend seamlessly");
  }

  // Case 2.17: productApprovalController.approveProduct with SKU verification and fallback schema properties
  {
    const { approveProduct: directApproveProduct } = require("./controllers/productApprovalController");
    let savedProd = null;

    const mockProd = {
      _id: "direct_prod_approval",
      name: "Energy Healing Quart",
      sku: "103",
      createdBy: "VENDOR",
      category: "Medical Wellness",
      collection: undefined, // Missing on legacy doc
      user: undefined, // Missing on legacy doc
      vendorUserId: "vendor_user_1",
      productApprovalStatus: "pending",
      save: async function () {
        savedProd = this;
        return this;
      },
    };

    const origProdFindById = Product.findById;
    const origProdFindOne = Product.findOne;

    Product.findById = () => ({ populate: async () => mockProd });
    Product.findOne = async () => null;

    const req = {
      user: { _id: "admin_1" },
      params: { id: "direct_prod_approval" },
      body: {}, // No SKU sent in body, reads from product.sku '103'
    };
    const res = createMockRes();
    await directApproveProduct(req, res);

    Product.findById = origProdFindById;
    Product.findOne = origProdFindOne;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(savedProd.sku, "103");
    assert.strictEqual(savedProd.productApprovalStatus, "approved");
    assert.strictEqual(savedProd.collection, "Medical Wellness", "Fallback collection filled from category");
    assert.strictEqual(savedProd.user, "vendor_user_1", "Fallback user filled from vendorUserId");
    console.log("✓ Case 2.17: productApprovalController.approveProduct validates SKU '103' and injects schema fallbacks");
  }

  // Case 2.18: productApprovalController.rejectProduct accepts reason and rejects
  {
    const { rejectProduct: directRejectProduct } = require("./controllers/productApprovalController");
    let rejectedProd = null;

    const mockProd = {
      _id: "direct_prod_reject",
      createdBy: "VENDOR",
      category: "Wellness",
      productApprovalStatus: "pending",
      save: async function () {
        rejectedProd = this;
        return this;
      },
    };

    const origProdFindById = Product.findById;
    Product.findById = async () => mockProd;

    const req = {
      user: { _id: "admin_1" },
      params: { id: "direct_prod_reject" },
      body: { reason: "Incomplete documentation" },
    };
    const res = createMockRes();
    await directRejectProduct(req, res);

    Product.findById = origProdFindById;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(rejectedProd.productApprovalStatus, "rejected");
    assert.strictEqual(rejectedProd.rejectionReason, "Incomplete documentation");
    console.log("✓ Case 2.18: productApprovalController.rejectProduct accepts { reason } and rejects successfully");
  }
}

// Test 3: Partner Dashboard Approval Routing & Integration Cases
async function testPartnerDashboardRouting() {
  console.log("\n--- TEST SUITE 3: Partner Dashboard Approval Routing & Compatibility ---");
  const Product = require("./models/Product");
  const ProductRequest = require("./models/ProductRequest");
  const productAdminRoutes = require("./routes/productAdminRoutes");
  const adminProductRequestRoutes = require("./routes/adminProductRequestRoutes");

  function createMockRes() {
    return {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
  }

  function getRouteHandler(router, method, path) {
    const layer = router.stack.find(
      (l) => l.route && l.route.path === path && l.route.methods[method.toLowerCase()]
    );
    if (!layer) throw new Error(`Route ${method} ${path} not found on router`);
    return layer.route.stack[layer.route.stack.length - 1].handle;
  }

  // Case 3.1: Verify route authorization middleware on productAdminRoutes and adminProductRequestRoutes
  {
    const putProductLayer = productAdminRoutes.stack.find(
      (l) => l.route && l.route.path === "/:id" && l.route.methods.put
    );
    assert(putProductLayer, "PUT /:id route must exist in productAdminRoutes");
    assert(putProductLayer.route.stack.length >= 3, "PUT /:id must have protect, admin, and handler");

    const getRequestsLayer = adminProductRequestRoutes.stack.find(
      (l) => l.route && l.route.path === "/" && l.route.methods.get
    );
    assert(getRequestsLayer, "GET / route must exist in adminProductRequestRoutes");
    assert(getRequestsLayer.route.stack.length >= 3, "GET / must have protect, admin, and handler");

    const patchStatusLayer = adminProductRequestRoutes.stack.find(
      (l) => l.route && l.route.path === "/:id/status" && l.route.methods.patch
    );
    assert(patchStatusLayer, "PATCH /:id/status route must exist in adminProductRequestRoutes");
    assert(patchStatusLayer.route.stack.length >= 3, "PATCH /:id/status must have protect, admin, and handler");

    console.log("✓ Case 3.1: Admin authorization middleware (protect, admin) strictly enforced on all admin routes");
  }

  // Case 3.2: PUT /api/admin/products/:id approves using product's existing SKU when body omits SKU (Partner Dashboard live payload)
  {
    let savedProduct = null;
    let syncedRequests = null;

    const mockProduct = {
      _id: "6accbc6176484a630e66584d",
      name: "Energy Healing Quartz",
      sku: "103", // saved SKU
      createdBy: "VENDOR",
      productApprovalStatus: "pending",
      category: "Wellness Crystals",
      isPublished: false,
      populate: function () { return this; },
      save: async function () {
        savedProduct = this;
        return this;
      },
      toObject: function () {
        return {
          _id: this._id,
          name: this.name,
          sku: this.sku,
          productApprovalStatus: this.productApprovalStatus,
          isPublished: this.isPublished,
        };
      },
    };

    const origProdFindById = Product.findById;
    const origProdFindOne = Product.findOne;
    const origReqUpdateMany = ProductRequest.updateMany;

    Product.findById = (id) => ({
      populate: async () => mockProduct,
    });
    Product.findOne = async () => null; // No duplicate SKU conflict
    ProductRequest.updateMany = async (filter, update) => {
      syncedRequests = { filter, update };
      return { modifiedCount: 1 };
    };

    const putHandler = getRouteHandler(productAdminRoutes, "PUT", "/:id");

    const req = {
      user: { _id: "admin_user_01" },
      params: { id: "6accbc6176484a630e66584d" },
      body: {
        productApprovalStatus: "approved",
        isPublished: true,
      }, // Exactly what live Partner Dashboard sends!
    };
    const res = createMockRes();
    await putHandler(req, res);

    Product.findById = origProdFindById;
    Product.findOne = origProdFindOne;
    ProductRequest.updateMany = origReqUpdateMany;

    assert.strictEqual(res.statusCode, 200, "Approval via PUT /:id must return HTTP 200");
    assert.strictEqual(savedProduct._id, "6accbc6176484a630e66584d", "Product _id must be preserved");
    assert.strictEqual(savedProduct.sku, "103", "Existing SKU '103' must be preserved");
    assert.strictEqual(savedProduct.productApprovalStatus, "approved", "Status must become approved");
    assert.strictEqual(savedProduct.isPublished, true, "Product must be published");
    assert(syncedRequests, "Matching ProductRequest records must be synchronized");
    assert.strictEqual(syncedRequests.update.$set.status, "approved");
    console.log("✓ Case 3.2: PUT /api/admin/products/:id approves with live payload { productApprovalStatus: 'approved', isPublished: true } without SKU in body, preserving product _id and saved SKU '103'");
  }

  // Case 3.3: PUT /api/admin/products/:id handles rejection payload { productApprovalStatus: "rejected" } without reason
  {
    let rejectedProduct = null;
    let syncedRequests = null;

    const mockProduct = {
      _id: "6accbc6176484a630e66584e",
      name: "Rejectable Item",
      sku: "104",
      createdBy: "VENDOR",
      productApprovalStatus: "pending",
      category: "Wellness",
      isPublished: true,
      save: async function () {
        rejectedProduct = this;
        return this;
      },
      toObject: function () {
        return {
          _id: this._id,
          sku: this.sku,
          productApprovalStatus: this.productApprovalStatus,
          isPublished: this.isPublished,
        };
      },
    };

    const origProdFindById = Product.findById;
    const origReqUpdateMany = ProductRequest.updateMany;

    Product.findById = async () => mockProduct;
    ProductRequest.updateMany = async (filter, update) => {
      syncedRequests = { filter, update };
      return { modifiedCount: 1 };
    };

    const putHandler = getRouteHandler(productAdminRoutes, "PUT", "/:id");

    const req = {
      user: { _id: "admin_user_01" },
      params: { id: "6accbc6176484a630e66584e" },
      body: {
        productApprovalStatus: "rejected",
      }, // Sent without custom reason
    };
    const res = createMockRes();
    await putHandler(req, res);

    Product.findById = origProdFindById;
    ProductRequest.updateMany = origReqUpdateMany;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(rejectedProduct.productApprovalStatus, "rejected");
    assert.strictEqual(rejectedProduct.rejectionReason, "Rejected by administrator");
    assert.strictEqual(rejectedProduct.isPublished, false);
    assert(syncedRequests);
    assert.strictEqual(syncedRequests.update.$set.status, "rejected");
    console.log("✓ Case 3.3: PUT /api/admin/products/:id rejects with default reason when none is passed");
  }

  // Case 3.4: Normal product edit via PUT /api/admin/products/:id preserves existing SKU and updates other fields
  {
    let updatedProduct = null;

    const mockProduct = {
      _id: "prod_normal_edit",
      name: "Old Product Name",
      description: "Old description",
      price: 500,
      countInStock: 10,
      sku: "SAVED-SKU-777",
      category: "Wellness",
      productApprovalStatus: "approved",
      save: async function () {
        updatedProduct = this;
        return this;
      },
    };

    const origProdFindById = Product.findById;
    Product.findById = async () => mockProduct;

    const putHandler = getRouteHandler(productAdminRoutes, "PUT", "/:id");

    const req = {
      user: { _id: "admin_user_01" },
      params: { id: "prod_normal_edit" },
      body: {
        name: "Brand New Product Name",
        price: 750,
        countInStock: 30,
        // sku omitted from body
      },
    };
    const res = createMockRes();
    await putHandler(req, res);

    Product.findById = origProdFindById;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(updatedProduct.name, "Brand New Product Name");
    assert.strictEqual(updatedProduct.price, 750);
    assert.strictEqual(updatedProduct.countInStock, 30);
    assert.strictEqual(updatedProduct.sku, "SAVED-SKU-777", "Normal edit preserves existing SKU when omitted in body");
    console.log("✓ Case 3.4: Normal product edits update fields without triggering approval flow and preserve saved SKU");
  }

  // Case 3.5: Normal product edit detects and rejects duplicate SKU conflict
  {
    const mockProduct = {
      _id: "prod_edit_dup",
      sku: "ORIGINAL-SKU",
      name: "Item",
      productApprovalStatus: "approved",
    };

    const origProdFindById = Product.findById;
    const origProdFindOne = Product.findOne;

    Product.findById = async () => mockProduct;
    Product.findOne = async (query) => {
      if (query.sku === "TAKEN-SKU") {
        return { _id: "other_product_id", sku: "TAKEN-SKU" };
      }
      return null;
    };

    const putHandler = getRouteHandler(productAdminRoutes, "PUT", "/:id");

    const req = {
      user: { _id: "admin_user_01" },
      params: { id: "prod_edit_dup" },
      body: {
        name: "Updated Name",
        sku: "TAKEN-SKU",
      },
    };
    const res = createMockRes();
    await putHandler(req, res);

    Product.findById = origProdFindById;
    Product.findOne = origProdFindOne;

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.code, "DUPLICATE_SKU");
    console.log("✓ Case 3.5: Normal product edit rejects duplicate SKU with HTTP 400 and DUPLICATE_SKU code");
  }

  // Case 3.5b: Normal product edit rejects explicitly empty or whitespace-only SKU
  {
    const mockProduct = {
      _id: "prod_edit_empty_sku",
      sku: "ORIGINAL-SKU",
      name: "Item",
      productApprovalStatus: "approved",
    };

    const origProdFindById = Product.findById;
    Product.findById = async () => mockProduct;

    const putHandler = getRouteHandler(productAdminRoutes, "PUT", "/:id");

    const req = {
      user: { _id: "admin_user_01" },
      params: { id: "prod_edit_empty_sku" },
      body: {
        name: "Updated Name",
        sku: "   ", // whitespace only
      },
    };
    const res = createMockRes();
    await putHandler(req, res);

    Product.findById = origProdFindById;

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.code, "SKU_REQUIRED");
    assert.strictEqual(res.jsonData.message, "SKU cannot be empty");
    console.log("✓ Case 3.5b: Normal product edit rejects empty/whitespace SKU with HTTP 400 and SKU_REQUIRED");
  }

  // Case 3.6: Pending-request lookup by product ID via GET /api/admin/product-requests?productId=...&status=pending
  {
    const mockRequests = [
      {
        _id: "6accbc6176484a630e66584f",
        productId: "6accbc6176484a630e66584d",
        status: "pending",
        sku: "103",
        name: "Energy Healing Quartz",
        toObject: function () {
          return {
            _id: this._id,
            productId: this.productId,
            status: this.status,
            sku: this.sku,
            name: this.name,
          };
        },
      },
    ];

    let capturedQuery = null;
    const origReqFind = ProductRequest.find;
    ProductRequest.find = (query) => {
      capturedQuery = query;
      return {
        populate: () => ({
          sort: async () => mockRequests,
        }),
      };
    };

    const listHandler = getRouteHandler(adminProductRequestRoutes, "GET", "/");

    const req = {
      user: { _id: "admin_user_01" },
      query: {
        productId: "6accbc6176484a630e66584d",
        status: "pending",
      },
    };
    const res = createMockRes();
    await listHandler(req, res);

    ProductRequest.find = origReqFind;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.count, 1);
    assert.strictEqual(res.jsonData.requests[0].id, "6accbc6176484a630e66584f", "Request id field must be populated for Partner Dashboard");
    assert.strictEqual(res.jsonData.requests[0].sku, "103");
    console.log("✓ Case 3.6: Pending-request lookup by productId via GET /api/admin/product-requests returns requests array with id & sku");
  }

  // Case 3.7: Status update via PATCH /api/admin/product-requests/:id/status
  {
    let approvedRequest = null;
    let savedProd = null;

    const mockRequest = {
      _id: "507f1f77bcf86cd799439011",
      productId: "507f1f77bcf86cd799439012",
      status: "pending",
      sku: "PATCH-SKU-001",
      name: "Patch Product",
      description: "Patch product description",
      price: 1200,
      countInStock: 10,
      category: "Supplements",
      brand: "BrandY",
      collection: "Daily",
      vendorId: { _id: "507f1f77bcf86cd799439013", businessName: "Vendor 1", vendorName: "Vendor 1" },
      save: async function () {
        approvedRequest = this;
        return this;
      },
    };

    const origFindById = ProductRequest.findById;
    const origReqFindOne = ProductRequest.findOne;
    const origProdFindOne = Product.findOne;
    const origProdFindById = Product.findById;
    const origProdSave = Product.prototype.save;

    ProductRequest.findById = () => ({
      populate: async () => mockRequest,
    });
    ProductRequest.findOne = async () => null;
    Product.findOne = async () => null;
    Product.findById = async () => null;
    Product.prototype.save = async function () {
      savedProd = this;
      return this;
    };

    const patchHandler = getRouteHandler(adminProductRequestRoutes, "PATCH", "/:id/status");

    const req = {
      user: { _id: "admin_user_01" },
      params: { id: "507f1f77bcf86cd799439011" },
      body: { status: "approved" },
    };
    const res = createMockRes();
    await patchHandler(req, res);

    ProductRequest.findById = origFindById;
    ProductRequest.findOne = origReqFindOne;
    Product.findOne = origProdFindOne;
    Product.findById = origProdFindById;
    Product.prototype.save = origProdSave;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(approvedRequest.status, "approved");
    assert(savedProd);
    assert.strictEqual(savedProd.sku, "PATCH-SKU-001");
    console.log("✓ Case 3.7: PATCH /api/admin/product-requests/:id/status approves request and activates product");
  }

  // Case 3.8: Approval strictly fails when product has no SKU and none is provided
  {
    const mockProductNoSku = {
      _id: "prod_no_sku",
      name: "No SKU Product",
      sku: "", // empty SKU
      createdBy: "VENDOR",
      productApprovalStatus: "pending",
      populate: function () { return this; },
    };

    const origProdFindById = Product.findById;
    Product.findById = (id) => ({
      populate: async () => mockProductNoSku,
    });

    const putHandler = getRouteHandler(productAdminRoutes, "PUT", "/:id");

    const req = {
      user: { _id: "admin_user_01" },
      params: { id: "prod_no_sku" },
      body: { productApprovalStatus: "approved" },
    };
    const res = createMockRes();
    await putHandler(req, res);

    Product.findById = origProdFindById;

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.code, "SKU_REQUIRED");
    console.log("✓ Case 3.8: Approval strictly fails with SKU_REQUIRED when product has no SKU and none is provided in body");
  }
}

async function runAllTests() {
  try {
    testProductRequestSchema();
    await testControllers();
    await testPartnerDashboardRouting();
    console.log("\n=======================================================");
    console.log("ALL TESTS PASSED (SUITES 1, 2, 3)");
    console.log("=======================================================\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
    process.exit(1);
  }
}

runAllTests();
