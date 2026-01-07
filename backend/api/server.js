const dotenv =require("dotenv");
const express = require("express");
const cors =require("cors");
const connectDB = require("../config/db");
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


const app= express();
app.use(express.json());
app.use(cors({domain:["https://metafit-a5ll.vercel.app"]}));

dotenv.config();
const PORT=process.env.PORT || 3000;

connectDB(); 

app.get("/",(req,res)=>{
res.send("Welcome Mwellnessbazar Its API");    
})

// API Routes
app.use("/api",paymentRoutes);
app.use("/api/users",userRoutes);
app.use("/api/products",productRoutes);
app.use("/api/cart",cartRoutes);
app.use("/api/checkout",checkoutRoutes);
app.use("/api/orders",orderRoutes);
app.use("/api/upload",uploadRoutes);

//Admin
app.use("/api/admin/users",adminRoutes);
app.use("/api/admin/products", productAdminRoutes);
app.use("/api/admin/orders", adminOrderRoutes);





app.use("/api/upload", videoUploadRoute);


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});