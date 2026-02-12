// emailTemplates.js
const transporter = require("../utils/email");

const generateBuyerEmail = (firstName, productList, totalAmount, payment_id, address) => {
  return `
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
  `;
};

const generateSellerEmail = (firstName, lastName, email, productList, totalAmount, payment_id, address) => {
  return `
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
  `;
};

const generateVendorApprovalEmail = (vendorName, companyName) => {
  return `
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
              <h1 style="margin:0; color:#ffffff; font-size:26px;">🎉 Vendor Approval Confirmed!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:30px; color:#e5e7eb;">
              <h2>Welcome to MetaFit, ${vendorName}!</h2>
              <p style="color:#9ca3af; font-size:15px;">Congratulations! Your vendor account has been approved by our admin team.</p>
              <div style="background:#020617; border:1px solid #1f2937; border-radius:10px; padding:20px; margin-top:20px;">
                <h3 style="margin-top:0; color:#ffffff;">Account Details</h3>
                <p><b>Company Name:</b> ${companyName}</p>
                <p><b>Status:</b> <span style="color:#10b981;">✓ APPROVED</span></p>
                <p><b>Approval Date:</b> ${new Date().toLocaleDateString()}</p>
              </div>
              <div style="background:#1f2937; border-left:4px solid #10b981; border-radius:6px; padding:16px; margin-top:20px;">
                <p style="margin:0; color:#9ca3af;"><strong>What's Next?</strong></p>
                <p style="margin:8px 0; color:#9ca3af; font-size:14px;">You can now start uploading products and managing your inventory. Log in to your vendor dashboard to get started.</p>
              </div>
              <p style="margin-top:20px; color:#9ca3af; font-size:14px;">If you have any questions, please reach out to our support team.</p>
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
  `;
};

const generateAdminVendorRequestEmail = (vendorName, companyName, email, phone, businessDescription, city, state) => {
  return `
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
            <td style="background:#f59e0b; padding:24px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:26px;">📋 New Vendor Registration Request</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:30px; color:#e5e7eb;">
              <h2>New vendor has requested to join MetaFit!</h2>
              <p style="color:#9ca3af; font-size:15px;">Please review the registration details below and approve or reject the request.</p>
              <div style="background:#020617; border:1px solid #1f2937; border-radius:10px; padding:20px; margin-top:20px;">
                <h3 style="margin-top:0; color:#ffffff;">Vendor Details</h3>
                <table width="100%" style="border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #1f2937;">
                    <td style="padding: 10px 0; color:#9ca3af;"><b>Name:</b></td>
                    <td style="padding: 10px 0; color:#e5e7eb;">${vendorName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1f2937;">
                    <td style="padding: 10px 0; color:#9ca3af;"><b>Company:</b></td>
                    <td style="padding: 10px 0; color:#e5e7eb;">${companyName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1f2937;">
                    <td style="padding: 10px 0; color:#9ca3af;"><b>Email:</b></td>
                    <td style="padding: 10px 0; color:#e5e7eb;">${email}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1f2937;">
                    <td style="padding: 10px 0; color:#9ca3af;"><b>Phone:</b></td>
                    <td style="padding: 10px 0; color:#e5e7eb;">${phone}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1f2937;">
                    <td style="padding: 10px 0; color:#9ca3af;"><b>Location:</b></td>
                    <td style="padding: 10px 0; color:#e5e7eb;">${city}, ${state}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color:#9ca3af;"><b>Business:</b></td>
                    <td style="padding: 10px 0; color:#e5e7eb;">${businessDescription}</td>
                  </tr>
                </table>
              </div>
              <div style="background:#1f2937; border-left:4px solid #f59e0b; border-radius:6px; padding:16px; margin-top:20px;">
                <p style="margin:0; color:#9ca3af;"><strong>Action Required</strong></p>
                <p style="margin:8px 0; color:#9ca3af; font-size:14px;">Please log in to the admin dashboard to review, approve, or reject this vendor registration request.</p>
              </div>
              <p style="margin-top:20px; color:#9ca3af; font-size:14px;">Submitted on: ${new Date().toLocaleString()}</p>
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
  `;
};

module.exports = {
  generateBuyerEmail,
  generateSellerEmail,
  generateVendorApprovalEmail,
  generateAdminVendorRequestEmail
};