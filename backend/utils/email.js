const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS (STARTTLS) for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // MUST be App Password
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Error:", error);
  } else {
    console.log("SMTP Server is ready to send emails");
  }
});

// Seller email transporter (for vendor approvals and seller notifications)
const sellerTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS (STARTTLS) for port 587
  auth: {
    user: process.env.SELLER_EMAIL,
    pass: process.env.SELLER_PASS, // MUST be App Password
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

sellerTransporter.verify((error, success) => {
  if (error) {
    console.error("Seller SMTP Error:", error);
  } else {
    console.log("Seller SMTP Server is ready to send emails");
  }
});

module.exports = transporter;
module.exports.sellerTransporter = sellerTransporter;
