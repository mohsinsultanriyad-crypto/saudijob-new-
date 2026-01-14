import express from "express";
import PushToken from "../models/PushToken.js";

const router = express.Router();

// normalize role
function normRole(r) {
  return String(r || "").trim().toLowerCase();
}

// Register or update push token
router.post("/register", async (req, res) => {
  try {
    const { token, roles } = req.body || {};
    if (!token) return res.status(400).json({ ok: false, message: "token required" });

    const cleanRoles = [...new Set((roles || []).map(normRole).filter(Boolean))];

    await PushToken.updateOne(
      { token },
      {
        $set: {
          token,
          roles: cleanRoles,
          lastSeen: new Date()
        }
      },
      { upsert: true }
    );

    console.log("[PUSH] Token registered:", token.slice(0, 15) + "...", "roles:", cleanRoles);
    res.json({ ok: true });
  } catch (err) {
    console.log("[PUSH] Register error:", err.message);
    res.status(500).json({ ok: false });
  }
});

export default router;