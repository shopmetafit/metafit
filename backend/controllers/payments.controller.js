const { createRazorpayInstance } = require("../config/razorpay.config");
const crypto = require("crypto");
const razorpayInstance = createRazorpayInstance();
const transporter = require("../utils/email");

exports.createOrder = (req, res) => {
  const { courseId, amount } = req.body;
  if (!courseId || !amount) {
    return res.status(400).json({
      message: "course id and amount required",
    });
  }

  const option = {
    amount: amount * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  try {
    razorpayInstance.orders.create(option, (err, order) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: " Something went wrong",
        });
      }
      return res.status(200).json(order);
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: " Something went wrong",
    });
  }
};

exports.verifyPayment = async (req, res) => {
  console.log("verifyPayment req.body:", req.body); // Debugging line
  const {
    order_id,
    payment_id,
    signature,
    email,
    products,
    totalAmount,
    firstName,
    lastName,
    address,
  } = req.body;

  // Generate HMAC signature to verify payment
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);
  hmac.update(order_id + "|" + payment_id);
  const generatedSignature = hmac.digest("hex");
const safeAddress = address || {};
// const buyerShippingInfo = `${firstName} ${lastName}, ${safeAddress.address || ""}, ${safeAddress.city || ""}, ${safeAddress.postalCode || ""}, ${safeAddress.country || ""}, ${safeAddress.phone || ""}`;

  if (generatedSignature !== signature) {
    return res.status(400).json({
      success: false,
      message: "Payment not verified",
    });
  }

  console.log("address", address);
  // console.log("buyerShippingInfo", buyerShippingInfo);


  // Build product list HTML
  const productList = products
    .map(
      (p) =>
        `<li>${p.name} - ₹${p.price} (Size: ${p.size}, Color: ${p.color})</li>`
    )
    .join("");

  try {
    // ---------------- BUYER EMAIL ----------------
    const buyerMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Order Confirmed 🎉",
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="margin:0; padding:0; background:#0f172a; font-family:Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:30px 10px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#020617; border-radius:12px; overflow:hidden;">
                <tr>
                  <td style="background:#10b981; padding:24px; text-align:center;">
                    <h1 style="margin:0; color:#ffffff; font-size:26px;">Order Confirmed! 🎉</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px; color:#e5e7eb;">
                    <h2>Thank you for your purchase, ${firstName}!</h2>
                    <p style="color:#9ca3af; font-size:15px;">Your order has been confirmed and is being processed.</p>
                    <div style="background:#020617; border:1px solid #1f2937; border-radius:10px; padding:20px; margin-top:20px;">
                      <h3 style="margin-top:0; color:#ffffff;">Order Details</h3>
                      <ul>${productList}</ul>
                      <hr style="border:none; border-top:1px solid #1f2937; margin:16px 0;" />
                      <p><b>Amount Paid:</b> ₹${totalAmount}</p>
                      <p><b>Payment ID:</b> ${payment_id}</p>
                      <p><b>Shipping Address:</b> ${address}</p>
                      <p><b>Order Date:</b> ${new Date().toLocaleDateString()}</p>
                    </div>
                    <p style="margin-top:20px; color:#9ca3af;">We'll notify you when your order is shipped.</p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#020617; padding:16px; text-align:center; color:#6b7280; font-size:12px;">
                    © ${new Date().getFullYear()} MetaFit · All rights reserved
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
    };

    // ---------------- SELLER EMAIL ----------------
    const sellerMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.SELLER_EMAIL,
      subject: `New Order from ${firstName} ${lastName}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="margin:0; padding:0; background:#0f172a; font-family:Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:30px 10px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#020617; border-radius:12px; overflow:hidden;">
                <tr>
                  <td style="background:#10b981; padding:24px; text-align:center;">
                    <h1 style="margin:0; color:#ffffff; font-size:26px;">New Order Received! 🎉</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px; color:#e5e7eb;">
                    <h2>New order received from ${firstName} ${lastName} (${email})</h2>
                    <p style="color:#9ca3af; font-size:15px;">Please process the order as soon as possible.</p>
                    <div style="background:#020617; border:1px solid #1f2937; border-radius:10px; padding:20px; margin-top:20px;">
                      <h3 style="margin-top:0; color:#ffffff;">Order Details</h3>
                      <ul>${productList}</ul>
                      <hr style="border:none; border-top:1px solid #1f2937; margin:16px 0;" />
                      <p><b>Amount Paid:</b> ₹${totalAmount}</p>
                      <p><b>Payment ID:</b> ${payment_id}</p>
                      <p><b>Shipping Address:</b> ${address}</p>
                      <p><b>Order Date:</b> ${new Date().toLocaleDateString()}</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background:#020617; padding:16px; text-align:center; color:#6b7280; font-size:12px;">
                    © ${new Date().getFullYear()} MetaFit · All rights reserved
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
    };

    // Send both emails in parallel
    await Promise.all([
      transporter.sendMail(buyerMailOptions),
      transporter.sendMail(sellerMailOptions),
    ]);

    return res.status(200).json({
      success: true,
      message: "Payment verified, buyer & seller notified",
    });
  } catch (err) {
    console.error("Error sending emails:", err);
    return res.status(500).json({
      success: false,
      message: "Payment verified but failed to send emails",
      error: err.message,
    });
  }
};