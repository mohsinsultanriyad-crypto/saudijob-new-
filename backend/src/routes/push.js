import express from "express";
import PushToken from "../models/PushToken.js";

const router = express.Router();

function normalizeRole(r) {
  return String(r || "").trim().toLowerCase();
}

// Register browser/device token
router.post("/register", async (req, res) => {
  try {
    const { token, roles } = req.body || {};
    if (!token) return res.status(400).json({ ok: false });

    const cleanRoles = [...new Set((roles || []).map(normalizeRole).filter(Boolean))];

    await PushToken.updateOne(
      { token },
      { $set: { token, roles: cleanRoles, lastSeen: new Date() } },
      { upsert: true }
    );

    console.log("[PUSH] Token registered:", token.slice(0, 15), "roles:", cleanRoles);
    res.json({ ok: true });
  } catch (e) {
    console.log("[PUSH] Register error:", e.message);
    res.status(500).json({ ok: false });
  }
});

export default router;
