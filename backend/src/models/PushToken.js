// backend/models/PushToken.js
import mongoose from "mongoose";

const PushTokenSchema = new mongoose.Schema(
  {
    // FCM token (device/browser token)
    token: { type: String, required: true, unique: true, index: true },

    // roles user wants alerts for (lowercase)
    roles: { type: [String], default: [], index: true },

    // optional info (helpful for debugging)
    platform: { type: String, default: "web" }, // web/android/ios etc
    userAgent: { type: String, default: "" },

    // last time token updated / pinged
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// normalize roles -> lowercase + trim + unique
PushTokenSchema.pre("save", function (next) {
  if (Array.isArray(this.roles)) {
    const normalized = this.roles
      .map((r) => String(r || "").trim().toLowerCase())
      .filter(Boolean);

    // unique roles
    this.roles = [...new Set(normalized)];
  }
  this.lastSeen = new Date();
  next();
});

export default mongoose.model("PushToken", PushTokenSchema);