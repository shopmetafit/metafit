const mongoose = require("mongoose");
const connectDB = async () => {
    try {
        const mongoUri =
            process.env.METAFIT_WELLNESS_MONGO_URI ||
            process.env.MONGO_URI ||
            process.env.URI;

        if (!mongoUri) {
            throw new Error("Missing MongoDB connection string. Set METAFIT_WELLNESS_MONGO_URI, MONGO_URI, or URI in environment.");
        }

        await mongoose.connect(mongoUri);
        console.log("mongoDB connected successfully")
    } catch (err) {
        console.log("mongoDB connection failed", err);
        process.exit(1);
    }
}

module.exports = connectDB;
