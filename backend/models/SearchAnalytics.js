const mongoose = require("mongoose");

const searchAnalyticsSchema = new mongoose.Schema(
  {
    query: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    searchCount: { type: Number, default: 1 },
    zeroResultCount: { type: Number, default: 0 },
    clicks: [
      {
        _id: false,
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        clickCount: { type: Number, default: 1 },
      },
    ],
    lastSearchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SearchAnalytics", searchAnalyticsSchema);
