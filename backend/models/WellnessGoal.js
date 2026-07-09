const mongoose = require("mongoose");

const wellnessGoalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    goals: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WellnessGoal", wellnessGoalSchema);
