const dotenv =require("dotenv");
const express = require("express");
const cors =require("cors");
const connectDB = require("../config/db");
const trackingSync = require("../utils/tracking-sync");
const userRoutes = require("../routes/userRoutes");
const productRoutes = require("../routes/productRoutes");
const cartRoutes = require("../routes/cartRoutes");
const checkoutRoutes = require("../routes/checkoutRoutes");
const orderRoutes = require("../routes/orderRoutes");
const uploadRoutes = require("../routes/uploadRoutes");
const adminRoutes = require("../routes/adminRoutes");
const productAdminRoutes = require("../routes/productAdminRoutes");
const adminOrderRoutes = require("../routes/adminOrderRoutes");
const paymentRoutes = require("../routes/payments.routes");
const videoUploadRoute = require("../routes/videoUpload");
const contactRoutes = require("../routes/contactRoutes");
const otpRoutes = require("../routes/otpRoutes").default;
const shipmentRoutes = require("../routes/shipmentRoutes");
const adminShipmentRoutes = require("../routes/adminShipmentRoutes");
const blogRoutes = require("../routes/blogRoutes");
const vendorRoutes = require("../routes/vendorRoutes")
const productRequestRoutes = require("../routes/productRequestRoutes")
const couponRoutes = require("../routes/couponRoutes");
const referralAdminRoutes = require("../routes/referralAdminRoutes");
const referralStoreRoutes = require("../routes/referralStoreRoutes");
const referralRoutes = require("../routes/referralRoutes");
const app= express();

const allowedOrigins = [
  "http://localhost:3005",
  "http://localhost:5173",
  "https://metafit-a5ll.vercel.app",
  "https://metafit-omega.vercel.app",
  "https://mwellnessbazaar.com",
  "https://www.mwellnessbazaar.com",
  "http://metafitwellness.com"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

dotenv.config();
const PORT=process.env.PORT || 3000;

connectDB(); 

app.get("/",(req,res)=>{
res.send("Welcome Mwellnessbazar Its API");    
})

// API Routes
app.use("/api/blogs",blogRoutes);

app.use("/api",paymentRoutes);
app.use("/api/users",userRoutes);
app.use("/api/products",productRoutes);
app.use("/api/cart",cartRoutes);
app.use("/api/checkout",checkoutRoutes);
app.use("/api/orders",orderRoutes);
app.use("/api/shipment",shipmentRoutes);
app.use("/api/upload",uploadRoutes);
app.use("/api/contact",contactRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/store", referralStoreRoutes);
app.use("/api/referrals", referralRoutes);


//Admin
app.use("/api/admin/users",adminRoutes);
app.use("/api/admin/products", productAdminRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/shipment", adminShipmentRoutes);
app.use("/api/admin", referralAdminRoutes);
app.use("/api/auth", otpRoutes);



app.use("/api/upload", videoUploadRoute);
app.use("/api/vendor", vendorRoutes);
app.use("/api/vendor/product-requests", productRequestRoutes);


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  
  // Start background tracking sync (only in production)
  if (process.env.NODE_ENV === "production") {
    trackingSync.start();
  }
});
