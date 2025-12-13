const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/Product");
const User = require("./models/User");
const Cart = require("./models/Cart");
const products = require("./data/products");
dotenv.config();

// connect to mongoDB
mongoose.connect(process.env.MONGO_URI);

// Function to send data
const seedData = async () => {
  try {
  

    // create a default admin User
    const createdUser = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "123456",
      role: "admin",
    });

    // Assign the default user ID to each product
    const userID = createdUser._id;

    const sampleProducts = products.map((product) => {
      return { ...product, user:userID };
    });

    // Insert the products into the database
    await Product.insertMany(sampleProducts);


    process.exit();
  } catch (error) {
    console.error("error seeding the data ", error);
    process.exit(1);
  }
};

seedData();
