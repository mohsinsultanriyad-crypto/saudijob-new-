import express from "express";
import PushToken from "../models/PushToken.js";

const router = express.Router();

// Register or update push token
router.post("/register", async (req, res) => {
  try {
    const { token, roles, platform, userAgent } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    // normalize roles
    const cleanRoles = Array.isArray(roles)
      ? roles.map(r => String(r).trim().toLowerCase()).filter(Boolean)
      : [];

    // upsert token
    const saved = await PushToken.findOneAndUpdate(
      { token },
      {
        token,
        roles: cleanRoles,
        platform: platform || "web",
        userAgent: userAgent || "",
        lastSeen: new Date()
      },
      { upsert: true, new: true }
    );

    console.log("[PUSH] Token registered:", saved.token);
    res.json({ ok: true });

  } catch (e) {
    console.log("Push register error:", e.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
