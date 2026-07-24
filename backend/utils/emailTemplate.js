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
                <p><b>Order Number:</b> ${payment_id}</p>
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

const generateSellerEmail = (firstName, lastName, email, phone, productList, totalAmount, payment_id, address) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:40px 10px;">
    <tr>
      <td align="center">
        <table width="650" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding:35px 20px; text-align:center;">
              <div style="background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <span style="font-size: 30px;">🎉</span>
              </div>
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:700; letter-spacing: 0.5px;">New Order Received!</h1>
              <p style="margin:10px 0 0 0; color:#d1fae5; font-size:16px;">You have a new order to fulfill on MetaFit</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:40px; color:#334155;">
              <h2 style="margin-top:0; color:#0f172a; font-size: 22px; font-weight: 600;">Hello Vendor,</h2>
              <p style="color:#64748b; font-size:16px; line-height:1.6;">Great news! A customer has purchased your products. Please review the details below and process the order as soon as possible.</p>
              
              <!-- Buyer Card -->
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:25px; margin-top:25px;">
                <h3 style="margin:0 0 15px 0; color:#10b981; font-size:18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">👤 Customer Details</h3>
                <table width="100%" style="border-collapse: collapse; font-size:15px;">
                  <tr>
                    <td style="padding: 8px 0; color:#64748b;" width="30%"><b>Name:</b></td>
                    <td style="padding: 8px 0; color:#0f172a;">${firstName} ${lastName || ""}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color:#64748b;"><b>Email:</b></td>
                    <td style="padding: 8px 0;"><a href="mailto:${email}" style="color:#10b981; text-decoration:none;">${email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color:#64748b;"><b>Phone:</b></td>
                    <td style="padding: 8px 0; color:#0f172a;">${phone || "N/A"}</td>
                  </tr>
                </table>
              </div>

              <!-- Order Details -->
              <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:25px; margin-top:25px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin:0 0 20px 0; color:#0f172a; font-size:18px;">📋 Products to Fulfill</h3>
                <div style="background:#f1f5f9; border-radius:8px; padding:15px; margin-bottom: 20px;">
                  <ul style="color:#334155; margin:0; padding-left:20px; font-size:15px; line-height: 1.6;">${productList}</ul>
                </div>
                
                <table width="100%" style="border-collapse: collapse; font-size:15px;">
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px 0; color:#64748b;"><b>Your Earnings for this Order:</b></td>
                    <td style="padding: 12px 0; color:#059669; font-size: 18px; font-weight:700; text-align: right;">₹${totalAmount}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px 0; color:#64748b;"><b>Order Number:</b></td>
                    <td style="padding: 12px 0; color:#334155; text-align: right; font-family: monospace; font-size:14px;">${payment_id}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px 0; color:#64748b;" valign="top"><b>Shipping Address:</b></td>
                    <td style="padding: 12px 0; color:#334155; text-align: right; line-height: 1.5; max-width: 250px;">${address}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color:#64748b;"><b>Order Date:</b></td>
                    <td style="padding: 12px 0; color:#334155; text-align: right;">${new Date().toLocaleString()}</td>
                  </tr>
                </table>
              </div>

              <!-- CTA -->
              <div style="text-align:center; margin-top:35px;">
                <a href="${process.env.VENDOR_DASHBOARD_URL || 'https://partner.mwellnessbazaar.com/vendor-login'}" style="display:inline-block; background:#10b981; color:#ffffff; font-weight:600; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:16px;">Go to Vendor Dashboard</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#f1f5f9; padding:24px; text-align:center; border-top: 1px solid #e2e8f0;">
              <p style="margin:0; color:#64748b; font-size:13px;">
                © ${new Date().getFullYear()} MetaFit Vendor System. All rights reserved.<br/>
                This is an automated notification, please do not reply.
              </p>
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



const generateAdminOrderEmail = (buyerName, buyerEmail, buyerPhone, sellerName, sellerEmail, sellerPhone, productList, totalAmount, payment_id, address) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:40px 10px;">
    <tr>
      <td align="center">
        <table width="650" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding:35px 20px; text-align:center;">
              <div style="background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <span style="font-size: 30px;">📦</span>
              </div>
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:700; letter-spacing: 0.5px;">New Order Alert</h1>
              <p style="margin:10px 0 0 0; color:#bfdbfe; font-size:16px;">Action required on MetaFit</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:40px; color:#334155;">
              <h2 style="margin-top:0; color:#0f172a; font-size: 22px; font-weight: 600;">Order Processing Required</h2>
              <p style="color:#64748b; font-size:16px; line-height:1.6;">A new order has been successfully placed and payment verified. Please review the details below.</p>
              
              <!-- Cards Container -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:25px;">
                <tr>
                  <!-- Buyer Card -->
                  <td width="48%" valign="top">
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; height:100%;">
                      <h3 style="margin:0 0 15px 0; color:#2563eb; font-size:16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">👤 Buyer Details</h3>
                      <p style="margin:0 0 8px 0; font-size:14px; line-height: 1.5;"><strong style="color:#475569;">Name:</strong> <br/><span style="color:#0f172a;">${buyerName}</span></p>
                      <p style="margin:0 0 8px 0; font-size:14px; line-height: 1.5;"><strong style="color:#475569;">Email:</strong> <br/><a href="mailto:${buyerEmail}" style="color:#2563eb; text-decoration:none;">${buyerEmail}</a></p>
                      <p style="margin:0; font-size:14px; line-height: 1.5;"><strong style="color:#475569;">Phone:</strong> <br/><span style="color:#0f172a;">${buyerPhone || "N/A"}</span></p>
                    </div>
                  </td>
                  <td width="4%"></td>
                  <!-- Seller Card -->
                  <td width="48%" valign="top">
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; height:100%;">
                      <h3 style="margin:0 0 15px 0; color:#2563eb; font-size:16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">🏪 Seller Details</h3>
                      <p style="margin:0 0 8px 0; font-size:14px; line-height: 1.5;"><strong style="color:#475569;">Name:</strong> <br/><span style="color:#0f172a;">${sellerName}</span></p>
                      <p style="margin:0 0 8px 0; font-size:14px; line-height: 1.5;"><strong style="color:#475569;">Email:</strong> <br/><a href="mailto:${sellerEmail}" style="color:#2563eb; text-decoration:none;">${sellerEmail}</a></p>
                      <p style="margin:0; font-size:14px; line-height: 1.5;"><strong style="color:#475569;">Phone:</strong> <br/><span style="color:#0f172a;">${sellerPhone || "N/A"}</span></p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Order Details -->
              <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:25px; margin-top:25px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin:0 0 20px 0; color:#0f172a; font-size:18px;">📋 Order Summary</h3>
                <div style="background:#f1f5f9; border-radius:8px; padding:15px; margin-bottom: 20px;">
                  <ul style="color:#334155; margin:0; padding-left:20px; font-size:15px; line-height: 1.6;">${productList}</ul>
                </div>
                
                <table width="100%" style="border-collapse: collapse; font-size:15px;">
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px 0; color:#64748b;"><b>Total Amount:</b></td>
                    <td style="padding: 12px 0; color:#059669; font-size: 18px; font-weight:700; text-align: right;">₹${totalAmount}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px 0; color:#64748b;"><b>Order Number:</b></td>
                    <td style="padding: 12px 0; color:#334155; text-align: right; font-family: monospace; font-size:14px;">${payment_id}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px 0; color:#64748b;" valign="top"><b>Shipping Address:</b></td>
                    <td style="padding: 12px 0; color:#334155; text-align: right; line-height: 1.5; max-width: 250px;">${address}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color:#64748b;"><b>Order Date:</b></td>
                    <td style="padding: 12px 0; color:#334155; text-align: right;">${new Date().toLocaleString()}</td>
                  </tr>
                </table>
              </div>

              <!-- CTA -->
              <div style="text-align:center; margin-top:35px;">
                <a href="${process.env.ADMIN_DASHBOARD_URL || 'https://partner.mwellnessbazaar.com/'}" style="display:inline-block; background:#2563eb; color:#ffffff; font-weight:600; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:16px;">View in Dashboard</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#f1f5f9; padding:24px; text-align:center; border-top: 1px solid #e2e8f0;">
              <p style="margin:0; color:#64748b; font-size:13px;">
                © ${new Date().getFullYear()} MetaFit Admin System. All rights reserved.<br/>
                This is an automated notification, please do not reply.
              </p>
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
  generateAdminVendorRequestEmail,
  generateAdminOrderEmail
};