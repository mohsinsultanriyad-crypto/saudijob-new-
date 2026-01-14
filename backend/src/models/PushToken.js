import mongoose from "mongoose";

const PushTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    roles: { type: [String], default: [], index: true },
    platform: { type: String, default: "web" },
    userAgent: { type: String, default: "" },
    lastSeen: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Normalize roles lowercase + unique
PushTokenSchema.pre("save", function (next) {
  if (Array.isArray(this.roles)) {
    const normalized = this.roles
      .map(r => String(r || "").trim().toLowerCase())
      .filter(Boolean);
    this.roles = [...new Set(normalized)];
  }
  this.lastSeen = new Date();
  next();
});

export default mongoose.model("PushToken", PushTokenSchema);
