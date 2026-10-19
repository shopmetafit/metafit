const transporter = require("./email");

const BRAND_NAME = "M Wellness Bazaar";
const SUPPORT_EMAIL = process.env.CONTACT_EMAIL || "info@metafitwellness.com";
const FROM_EMAIL = process.env.EMAIL_USER || "noreply@mwellnessbazaar.com";

/**
 * Format date for email display
 */
const formatDate = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/**
 * Escape HTML to prevent injection in emails
 */
const escapeHtml = (text) => {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Send ticket creation confirmation to customer
 */
const sendTicketCreatedCustomerEmail = async (ticket) => {
  try {
    if (!ticket || !ticket.customerEmail) return;

    const mailOptions = {
      from: `"${BRAND_NAME} Support" <${FROM_EMAIL}>`,
      to: ticket.customerEmail,
      subject: `Support Ticket Received: [${ticket.ticketNumber}] ${ticket.subject}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0; padding:0; background:#f4f6f8; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding:30px 10px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background:#022824; padding:24px 30px; text-align:left;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700;">${BRAND_NAME}</h1>
              <p style="margin:4px 0 0 0; color:#5eead4; font-size:13px; font-weight:500;">Customer Help &amp; Support</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 30px;">
              <h2 style="margin:0 0 16px 0; color:#0f172a; font-size:18px;">Hello ${escapeHtml(ticket.customerName)},</h2>
              <p style="margin:0 0 20px 0; color:#475569; font-size:15px; line-height:1.5;">
                We have received your support request. Our customer care team is reviewing it and will respond as soon as possible.
              </p>

              <!-- Ticket Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:18px; margin-bottom:24px;">
                <tr>
                  <td style="padding:6px 0; font-size:13px; color:#64748b; width:130px;"><b>Ticket ID:</b></td>
                  <td style="padding:6px 0; font-size:14px; color:#0f172a; font-weight:700;">${escapeHtml(ticket.ticketNumber)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-size:13px; color:#64748b;"><b>Category:</b></td>
                  <td style="padding:6px 0; font-size:13px; color:#0f172a;">${escapeHtml(ticket.category)}</td>
                </tr>
                ${
                  ticket.orderNumber
                    ? `<tr>
                  <td style="padding:6px 0; font-size:13px; color:#64748b;"><b>Related Order:</b></td>
                  <td style="padding:6px 0; font-size:13px; color:#047ca8; font-weight:600;">${escapeHtml(ticket.orderNumber)}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="padding:6px 0; font-size:13px; color:#64748b;"><b>Subject:</b></td>
                  <td style="padding:6px 0; font-size:13px; color:#0f172a; font-weight:600;">${escapeHtml(ticket.subject)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-size:13px; color:#64748b;"><b>Status:</b></td>
                  <td style="padding:6px 0; font-size:13px; color:#059669; font-weight:600;">${escapeHtml(ticket.status)}</td>
                </tr>
              </table>

              <!-- Description -->
              <h3 style="margin:0 0 8px 0; color:#334155; font-size:14px;">Your Description:</h3>
              <div style="background:#ffffff; border:1px solid #e2e8f0; border-left:4px solid #047ca8; border-radius:4px; padding:12px 16px; color:#334155; font-size:14px; line-height:1.6; white-space:pre-wrap;">
                ${escapeHtml(ticket.description)}
              </div>

              <p style="margin:24px 0 0 0; color:#64748b; font-size:13px; line-height:1.5;">
                You can track and reply to this ticket anytime under <b>My Account &gt; Help &amp; Support</b> on our website.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:16px 30px; text-align:center; color:#94a3b8; font-size:12px;">
              &copy; ${new Date().getFullYear()} ${BRAND_NAME} &middot; All rights reserved.
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

    await transporter.sendMail(mailOptions);
  } catch (error) {
    // Non-blocking log
    console.error("Failed to send ticket created email to customer:", error.message);
  }
};

/**
 * Send alert to support team when new ticket is opened
 */
const sendTicketCreatedAdminAlert = async (ticket) => {
  try {
    const mailOptions = {
      from: `"${BRAND_NAME} Alerts" <${FROM_EMAIL}>`,
      to: SUPPORT_EMAIL,
      subject: `[New Ticket] ${ticket.ticketNumber} - ${ticket.category} - ${ticket.subject}`,
      html: `
        <h3>New Support Ticket Created</h3>
        <p><b>Ticket ID:</b> ${escapeHtml(ticket.ticketNumber)}</p>
        <p><b>Customer:</b> ${escapeHtml(ticket.customerName)} (${escapeHtml(ticket.customerEmail)})</p>
        ${ticket.customerPhone ? `<p><b>Phone:</b> ${escapeHtml(ticket.customerPhone)}</p>` : ""}
        <p><b>Category:</b> ${escapeHtml(ticket.category)}</p>
        ${ticket.orderNumber ? `<p><b>Order Number:</b> ${escapeHtml(ticket.orderNumber)}</p>` : ""}
        <p><b>Subject:</b> ${escapeHtml(ticket.subject)}</p>
        <p><b>Description:</b></p>
        <div style="background:#f1f5f9; padding:12px; border-radius:6px; font-family:sans-serif;">${escapeHtml(ticket.description)}</div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send admin ticket alert:", error.message);
  }
};

/**
 * Send notification to customer when support agent replies
 */
const sendTicketReplyCustomerEmail = async (ticket, replyMessage) => {
  try {
    if (!ticket || !ticket.customerEmail) return;

    const mailOptions = {
      from: `"${BRAND_NAME} Support" <${FROM_EMAIL}>`,
      to: ticket.customerEmail,
      subject: `Reply to Ticket [${ticket.ticketNumber}]: ${ticket.subject}`,
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#f4f6f8; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 10px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden;">
          <tr>
            <td style="background:#022824; padding:20px 30px;">
              <h2 style="margin:0; color:#ffffff; font-size:20px;">Support Team Response</h2>
              <p style="margin:4px 0 0 0; color:#5eead4; font-size:13px;">Ticket #${escapeHtml(ticket.ticketNumber)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 30px;">
              <p style="margin:0 0 16px 0; color:#334155; font-size:14px;">
                Hello <b>${escapeHtml(ticket.customerName)}</b>, our support team has replied to your ticket regarding <b>${escapeHtml(ticket.subject)}</b>:
              </p>

              <div style="background:#f8fafc; border-left:4px solid #10b981; padding:16px; border-radius:6px; margin:20px 0; font-size:14px; line-height:1.6; color:#0f172a; white-space:pre-wrap;">
                ${escapeHtml(replyMessage)}
              </div>

              <p style="color:#64748b; font-size:13px;">
                Current Status: <b style="color:#047ca8;">${escapeHtml(ticket.status)}</b>
              </p>

              <p style="margin-top:20px; font-size:13px; color:#64748b;">
                To view the conversation or send a response, please visit <b>My Account &gt; Help &amp; Support</b>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:14px; text-align:center; font-size:12px; color:#94a3b8;">
              &copy; ${new Date().getFullYear()} ${BRAND_NAME}
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

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send reply notification email:", error.message);
  }
};

module.exports = {
  sendTicketCreatedCustomerEmail,
  sendTicketCreatedAdminAlert,
  sendTicketReplyCustomerEmail,
};
