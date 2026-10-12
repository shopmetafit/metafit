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
}

async function runAllTests() {
  try {
    testProductRequestSchema();
    await testControllers();
    console.log("\n=======================================================");
    console.log("ALL SKU VERIFICATION AND VALIDATION TESTS PASSED (10/10)");
    console.log("=======================================================\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
    process.exit(1);
  }
}

runAllTests();
