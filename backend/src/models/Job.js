import mongoose from "mongoose";

const JobSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  city: { type: String, required: true },
  jobRole: { type: String, required: true },
  description: { type: String, required: true },

  isUrgent: { type: Boolean, default: false },
  urgentUntil: { type: Date, default: null },

  views: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto delete after 7 days (TTL runs in background, may be delayed)
JobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Helpful indexes
JobSchema.index({ city: 1, createdAt: -1 });
JobSchema.index({ jobRole: 1, createdAt: -1 });
JobSchema.index({ isUrgent: 1, urgentUntil: 1, createdAt: -1 });

export default mongoose.model("Job", JobSchema);
