const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Ticket = require("./models/Ticket");
const User = require("./models/User");
const Order = require("./models/Order");
const {
  createTicket,
  getMyTickets,
  getTicketById,
  addReply,
  closeCustomerTicket,
  adminGetAllTickets,
  adminGetTicketStats,
  adminUpdateTicketStatus,
} = require("./controllers/ticketController");

// Helper to mock express req and res
const createMockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
};

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING HELP & SUPPORT TICKETING SYSTEM TEST SUITE");
  console.log("==================================================");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] Test ${totalTests}: ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  const mongoUri =
    process.env.MONGO_URI ||
    "mongodb+srv://shopmetafit:lXg32cAJNDoNXo6v@cluster0.8dqecof.mongodb.net/metafit?retryWrites=true&w=majority&appName=Cluster0";

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const testUserAId = new mongoose.Types.ObjectId();
  const testUserBId = new mongoose.Types.ObjectId();
  const testAdminId = new mongoose.Types.ObjectId();

  const userA = {
    _id: testUserAId,
    name: "Customer Alpha",
    email: "alpha_test@example.com",
    role: "customer",
  };

  const userB = {
    _id: testUserBId,
    name: "Customer Beta",
    email: "beta_test@example.com",
    role: "customer",
  };

  const adminUser = {
    _id: testAdminId,
    name: "Admin Support",
    email: "support_admin@example.com",
    role: "admin",
  };

  let createdTicketA = null;
  let createdTicketB = null;

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Authenticated Customer can create a valid ticket
    // ------------------------------------------------------------------------
    {
      const req = {
        user: userA,
        body: {
          category: "Order & Delivery",
          subject: "Package has not arrived yet",
          description: "My order was supposed to arrive yesterday according to BlueDart tracking.",
        },
      };
      const res = createMockRes();
      await createTicket(req, res);

      assert(res.statusCode === 201, "Customer A can create a ticket with 201 Created");
      assert(res.data.success === true, "Response has success: true");
      assert(res.data.ticket && res.data.ticket.ticketNumber, "Ticket has a valid ticketNumber");
      assert(res.data.ticket.ticketNumber.startsWith("MWB-TKT-"), "Ticket number follows MWB-TKT- pattern");
      assert(res.data.ticket.status === "Open", "Initial status is 'Open'");
      assert(res.data.ticket.messages.length === 1, "Initial description recorded as first message");

      createdTicketA = res.data.ticket;
    }

    // ------------------------------------------------------------------------
    // TEST 2: Required fields and validation checks
    // ------------------------------------------------------------------------
    {
      // Missing category
      const req1 = {
        user: userA,
        body: {
          category: "InvalidCategoryXYZ",
          subject: "Some subject",
          description: "Valid description longer than 10 characters",
        },
      };
      const res1 = createMockRes();
      await createTicket(req1, res1);
      assert(res1.statusCode === 400, "Invalid category is rejected with 400 Bad Request");

      // Short subject (< 3 chars)
      const req2 = {
        user: userA,
        body: {
          category: "Payment Issues",
          subject: "Hi",
          description: "Valid description longer than 10 characters",
        },
      };
      const res2 = createMockRes();
      await createTicket(req2, res2);
      assert(res2.statusCode === 400, "Subject < 3 chars rejected with 400");

      // Short description (< 10 chars)
      const req3 = {
        user: userA,
        body: {
          category: "Payment Issues",
          subject: "Money deducted",
          description: "Short",
        },
      };
      const res3 = createMockRes();
      await createTicket(req3, res3);
      assert(res3.statusCode === 400, "Description < 10 chars rejected with 400");
    }

    // ------------------------------------------------------------------------
    // TEST 3: Ticket IDs / Numbers are unique
    // ------------------------------------------------------------------------
    {
      const req = {
        user: userB,
        body: {
          category: "Product Information",
          subject: "Ingredients of Shilajit Resin",
          description: "Could you share the third-party purity lab certificate for this batch?",
        },
      };
      const res = createMockRes();
      await createTicket(req, res);

      assert(res.statusCode === 201, "Customer B can create a ticket");
      createdTicketB = res.data.ticket;
      assert(
        createdTicketA.ticketNumber !== createdTicketB.ticketNumber,
        "Generated ticket numbers are unique across tickets"
      );
    }

    // ------------------------------------------------------------------------
    // TEST 4: Customer can view their own tickets
    // ------------------------------------------------------------------------
    {
      const req = {
        user: userA,
        query: { status: "All" },
      };
      const res = createMockRes();
      await getMyTickets(req, res);

      assert(res.statusCode === 200, "Customer A can fetch their tickets");
      assert(Array.isArray(res.data.tickets), "Returned tickets is an array");
      const foundA = res.data.tickets.some((t) => t.ticketNumber === createdTicketA.ticketNumber);
      assert(foundA, "Customer A's created ticket appears in their list");
    }

    // ------------------------------------------------------------------------
    // TEST 5: Customer cannot see another customer's tickets in their list
    // ------------------------------------------------------------------------
    {
      const req = {
        user: userA,
        query: { status: "All" },
      };
      const res = createMockRes();
      await getMyTickets(req, res);

      const foundB = res.data.tickets.some((t) => t.ticketNumber === createdTicketB.ticketNumber);
      assert(!foundB, "Customer A cannot see Customer B's tickets in their ticket list");
    }

    // ------------------------------------------------------------------------
    // TEST 6: Customer cannot access another customer's ticket by ID (Direct ID tampering)
    // ------------------------------------------------------------------------
    {
      // Customer A tries to access Customer B's ticket ID
      const req = {
        user: userA,
        params: { id: createdTicketB._id.toString() },
      };
      const res = createMockRes();
      await getTicketById(req, res);

      assert(res.statusCode === 403, "Access to another customer's ticket returns 403 Forbidden");
    }

    // ------------------------------------------------------------------------
    // TEST 7: Order ownership check (Customer cannot link another user's order)
    // ------------------------------------------------------------------------
    {
      const fakeOrderUserB = new mongoose.Types.ObjectId();
      const fakeOrderId = new mongoose.Types.ObjectId();

      // Temporarily create an order belonging to another user
      const order = new Order({
        _id: fakeOrderId,
        user: fakeOrderUserB,
        orderItems: [
          {
            productId: new mongoose.Types.ObjectId(),
            name: "Protein Bar",
            image: "test.jpg",
            price: 500,
            quantity: 1,
          },
        ],
        shippingAddress: {
          address: "123 Street",
          city: "Udaipur",
          postalCode: "313001",
          country: "India",
        },
        paymentMethod: "Razorpay",
        paymentId: "pay_test_order_12345",
        totalPrice: 500,
      });
      await order.save();

      // Customer A tries to link Customer B's order
      const req = {
        user: userA,
        body: {
          category: "Order & Delivery",
          subject: "Order not received",
          description: "This is a test description attempting to link another user's order.",
          orderId: fakeOrderId.toString(),
        },
      };
      const res = createMockRes();
      await createTicket(req, res);

      assert(
        res.statusCode === 400,
        "Linking an order that does not belong to the user returns 400 Bad Request"
      );

      // Clean up temporary order
      await Order.deleteOne({ _id: fakeOrderId });
    }

    // ------------------------------------------------------------------------
    // TEST 8: Ordinary customer cannot access admin-only endpoints
    // ------------------------------------------------------------------------
    {
      // (Verified by authMiddleware `admin` check: req.user.role !== 'admin' -> 403)
      const { admin } = require("./middleware/authMiddleware");
      const req = { user: userA };
      const res = createMockRes();
      let nextCalled = false;
      admin(req, res, () => {
        nextCalled = true;
      });

      assert(!nextCalled && res.statusCode === 403, "Non-admin user is rejected with 403 by admin middleware");
    }

    // ------------------------------------------------------------------------
    // TEST 9: Duplicate submission protection (within 60s)
    // ------------------------------------------------------------------------
    {
      const req = {
        user: userA,
        body: {
          category: "Order & Delivery",
          subject: "Package has not arrived yet",
          description: "My order was supposed to arrive yesterday according to BlueDart tracking.",
        },
      };
      const res = createMockRes();
      await createTicket(req, res);

      assert(
        res.statusCode === 409,
        "Duplicate submission with identical subject and description returns 409 Conflict"
      );
    }

    // ------------------------------------------------------------------------
    // TEST 10: Authorized support staff can reply and update ticket status
    // ------------------------------------------------------------------------
    {
      // Admin replies to Ticket A
      const replyReq = {
        user: adminUser,
        params: { id: createdTicketA._id.toString() },
        body: {
          message: "We have contacted BlueDart. Your package is out for delivery today.",
        },
      };
      const replyRes = createMockRes();
      await addReply(replyReq, replyRes);

      assert(replyRes.statusCode === 200, "Support staff reply succeeds with 200");
      assert(
        replyRes.data.ticket.status === "Waiting for Customer",
        "Admin reply transitions status to 'Waiting for Customer'"
      );
      assert(replyRes.data.ticket.messages.length === 2, "Ticket now has 2 messages");
      assert(
        replyRes.data.ticket.messages[1].senderRole === "admin",
        "Reply message senderRole is 'admin'"
      );

      // Admin updates status to Resolved
      const statusReq = {
        user: adminUser,
        params: { id: createdTicketA._id.toString() },
        body: {
          status: "Resolved",
          priority: "High",
          note: "Delivered confirmed by BlueDart dispatch.",
        },
      };
      const statusRes = createMockRes();
      await adminUpdateTicketStatus(statusReq, statusRes);

      assert(statusRes.statusCode === 200, "Status update succeeds with 200");
      assert(statusRes.data.ticket.status === "Resolved", "Ticket status is now 'Resolved'");
      assert(statusRes.data.ticket.priority === "High", "Ticket priority updated to 'High'");
      assert(statusRes.data.ticket.resolvedAt !== null, "resolvedAt timestamp is populated");
    }

    // ------------------------------------------------------------------------
    // TEST 11: Replies display in chronological order
    // ------------------------------------------------------------------------
    {
      // Customer A replies back to reopen/follow-up
      const replyReq = {
        user: userA,
        params: { id: createdTicketA._id.toString() },
        body: {
          message: "Thank you! I have received the parcel in good condition.",
        },
      };
      const replyRes = createMockRes();
      await addReply(replyReq, replyRes);

      assert(replyRes.statusCode === 200, "Customer follow-up reply succeeds");
      const msgs = replyRes.data.ticket.messages;
      assert(msgs.length === 4, "Messages thread has all replies recorded");

      const t1 = new Date(msgs[0].createdAt).getTime();
      const t2 = new Date(msgs[1].createdAt).getTime();
      const t3 = new Date(msgs[2].createdAt).getTime();
      const t4 = new Date(msgs[3].createdAt).getTime();
      assert(t1 <= t2 && t2 <= t3 && t3 <= t4, "Messages are recorded and stored in chronological order");
    }

    // ------------------------------------------------------------------------
    // TEST 12: Customer can close their own ticket
    // ------------------------------------------------------------------------
    {
      const req = {
        user: userA,
        params: { id: createdTicketA._id.toString() },
      };
      const res = createMockRes();
      await closeCustomerTicket(req, res);

      assert(res.statusCode === 200, "Customer can close their own ticket");
      assert(res.data.ticket.status === "Closed", "Ticket is marked Closed");
      assert(res.data.ticket.closedAt !== null, "closedAt timestamp is recorded");
    }

    // ------------------------------------------------------------------------
    // TEST 13: Admin can list and filter all tickets & view stats
    // ------------------------------------------------------------------------
    {
      const req = {
        user: adminUser,
        query: { status: "All", page: 1, limit: 10 },
      };
      const res = createMockRes();
      await adminGetAllTickets(req, res);

      assert(res.statusCode === 200, "Admin can list all tickets");
      assert(res.data.tickets.length >= 2, "Admin sees tickets from multiple users");

      // Stats
      const statsReq = { user: adminUser };
      const statsRes = createMockRes();
      await adminGetTicketStats(statsReq, statsRes);
      assert(statsRes.statusCode === 200, "Admin can retrieve ticket metrics");
      assert(typeof statsRes.data.stats.total === "number", "Stats contains total count");
      assert(typeof statsRes.data.stats.open === "number", "Stats contains open count");
    }

    console.log("\n==================================================");
    console.log(`ALL ${passedTests} TESTS PASSED SUCCESSFULLY!`);
    console.log("==================================================");
  } finally {
    // Clean up test tickets
    if (createdTicketA) {
      await Ticket.deleteOne({ _id: createdTicketA._id });
    }
    if (createdTicketB) {
      await Ticket.deleteOne({ _id: createdTicketB._id });
    }
    await mongoose.disconnect();
    console.log("Cleaned up test data and disconnected from MongoDB.");
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
