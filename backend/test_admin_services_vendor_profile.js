/**
 * Test Suite: Admin-Services Vendor Profile & Pickup Address Integration
 *
 * Verifies:
 * 1. GET /api/vendor/profile without token returns HTTP 401.
 * 2. GET /api/vendor/profile with invalid token returns HTTP 401.
 * 3. GET /api/vendor/profile with valid vendor token returns HTTP 200 and profile.
 * 4. PUT /api/vendor/profile rejects short street (< 5 chars) with HTTP 400.
 * 5. PUT /api/vendor/profile rejects invalid PIN code (e.g. "123") with HTTP 400.
 * 6. PUT /api/vendor/profile rejects invalid contact phone (< 10 digits) with HTTP 400.
 * 7. PUT /api/vendor/profile with valid payload saves pickup address and returns HTTP 200.
 * 8. GET /api/vendor/profile confirms persistence of updated pickup address.
 * 9. PUT /api/vendor/profile safely clears/removes pickup address when requested.
 * 10. Next.js API proxy (http://127.0.0.1:3000/api/vendor/profile) correctly forwards requests.
 */

const assert = require("assert");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "tHisI$@Vrand@1928MadeBySudheer";
const ADMIN_SERVICES_URL = "http://127.0.0.1:5001/api";
const NEXT_PROXY_URL = "http://127.0.0.1:3000/api";

// Known approved vendor: Surya Trivedi
const VENDOR_ID = "6a3800c6efa7a23927274ebf";

const vendorToken = jwt.sign(
  { id: VENDOR_ID, vendorId: VENDOR_ID, role: "vendor" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

let passed = 0;
let total = 0;

async function test(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    throw err;
  }
}

async function run() {
  console.log("==================================================================");
  console.log(" ADMIN-SERVICES VENDOR PROFILE & PICKUP ADDRESS TEST SUITE");
  console.log("==================================================================\n");

  // 1. Unauthorized GET
  await test("1. GET /api/vendor/profile without token returns HTTP 401", async () => {
    const res = await fetch(`${ADMIN_SERVICES_URL}/vendor/profile`);
    assert.strictEqual(res.status, 401);
  });

  // 2. Invalid token GET
  await test("2. GET /api/vendor/profile with invalid token returns HTTP 401", async () => {
    const res = await fetch(`${ADMIN_SERVICES_URL}/vendor/profile`, {
      headers: { Authorization: "Bearer bad-token" },
    });
    assert.strictEqual(res.status, 401);
  });

  // 3. Authorized GET
  await test("3. GET /api/vendor/profile with valid vendor token returns HTTP 200", async () => {
    const res = await fetch(`${ADMIN_SERVICES_URL}/vendor/profile`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(String(data.vendor.id), VENDOR_ID);
    assert(data.vendor.email, "vendor email should be present");
  });

  // 4. PUT validation: street length
  await test("4. PUT /api/vendor/profile rejects short street (< 5 chars) with HTTP 400", async () => {
    const res = await fetch(`${ADMIN_SERVICES_URL}/vendor/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        pickupAddress: {
          street: "123",
          city: "Ahmedabad",
          state: "Gujarat",
          pincode: "380006",
          contactPerson: "Surya",
          contactPhone: "9876543210",
        },
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.code, "INVALID_PICKUP_ADDRESS");
    assert(data.errors.street, "street error should be present");
  });

  // 5. PUT validation: invalid PIN
  await test("5. PUT /api/vendor/profile rejects invalid PIN code with HTTP 400", async () => {
    const res = await fetch(`${ADMIN_SERVICES_URL}/vendor/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        pickupAddress: {
          street: "Sector 14 Warehouse",
          city: "Ahmedabad",
          state: "Gujarat",
          pincode: "3800A",
          contactPerson: "Surya",
          contactPhone: "9876543210",
        },
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert(data.errors.pincode, "pincode error should be present");
  });

  // 6. PUT validation: invalid phone
  await test("6. PUT /api/vendor/profile rejects invalid phone with HTTP 400", async () => {
    const res = await fetch(`${ADMIN_SERVICES_URL}/vendor/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        pickupAddress: {
          street: "Sector 14 Warehouse",
          city: "Ahmedabad",
          state: "Gujarat",
          pincode: "380006",
          contactPerson: "Surya",
          contactPhone: "12345",
        },
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert(data.errors.contactPhone, "contactPhone error should be present");
  });

  // 7. PUT valid save
  await test("7. PUT /api/vendor/profile saves valid pickup address with HTTP 200", async () => {
    const res = await fetch(`${ADMIN_SERVICES_URL}/vendor/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        pickupAddress: {
          street: "Plot 88 Industrial Area Phase 2",
          city: "Ahmedabad",
          state: "Gujarat",
          pincode: "380015",
          contactPerson: "Surya Trivedi",
          contactPhone: "9876543210",
        },
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.vendor.pickupAddress.pincode, "380015");
    assert.strictEqual(data.vendor.city, "Ahmedabad");
  });

  // 8. GET confirms persistence
  await test("8. GET /api/vendor/profile returns persisted address", async () => {
    const res = await fetch(`${ADMIN_SERVICES_URL}/vendor/profile`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.vendor.pickupAddress.pincode, "380015");
    assert.strictEqual(data.vendor.pickupAddress.contactPerson, "Surya Trivedi");
  });

  // 9. PUT remove address (Restoring original state!)
  await test("9. PUT /api/vendor/profile safely removes address and restores state", async () => {
    const res = await fetch(`${ADMIN_SERVICES_URL}/vendor/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        removePickupAddress: true,
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.vendor.pickupAddress, null);

    // Verify GET also returns null
    const checkRes = await fetch(`${ADMIN_SERVICES_URL}/vendor/profile`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    const checkData = await checkRes.json();
    assert.strictEqual(checkData.vendor.pickupAddress, null);
  });

  // 10. Next.js API Proxy Verification
  await test("10. Next.js proxy (http://127.0.0.1:3000/api/vendor/profile) forwards to admin-services", async () => {
    const res = await fetch(`${NEXT_PROXY_URL}/vendor/profile`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(String(data.vendor.id), VENDOR_ID);
  });

  console.log(`\n==================================================================`);
  console.log(` RESULTS: ${passed}/${total} TESTS PASSED`);
  console.log(`==================================================================\n`);
}

run().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
