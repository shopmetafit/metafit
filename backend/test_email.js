require('dotenv').config();
const transporter = require('./utils/email');

async function test() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "Test Buyer Email",
      text: "This is a test buyer email"
    });
    console.log("Buyer email sent:", info.response);
  } catch (err) {
    console.error("Buyer Email Error:", err.message);
  }

  try {
    const info2 = await transporter.sellerTransporter.sendMail({
      from: process.env.SELLER_EMAIL,
      to: process.env.EMAIL_USER,
      subject: "Test Seller Email",
      text: "This is a test seller email"
    });
    console.log("Seller email sent:", info2.response);
  } catch (err) {
    console.error("Seller Email Error:", err.message);
  }
}
test();
