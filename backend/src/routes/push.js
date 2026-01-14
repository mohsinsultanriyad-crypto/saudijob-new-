// backend/src/routes/push.js
import express from "express";
import PushToken from "../models/PushToken.js";

const router = express.Router();

// POST /api/push/register
// body: { token, roles: ["Plumber","Driver"], platform? }
router.post("/register", async (req, res) => {
  try {
    const token = String(req.body.token || "").trim();
    const roles = Array.isArray(req.body.roles) ? req.body.roles : [];
    const platform = String(req.body.platform || "web");
    const userAgent = String(req.headers["user-agent"] || "");

    if (!token) return res.status(400).json({ message: "token required" });

    const normalizedRoles = roles
      .map((r) => String(r || "").trim().toLowerCase())
      .filter(Boolean);

    // upsert = create if not exist, else update
    await PushToken.updateOne(
      { token },
      {
        $set: {
          token,
          roles: [...new Set(normalizedRoles)],
          platform,
          userAgent,
          lastSeen: new Date(),
        },
      },
      { upsert: true }
    );

    res.json({ ok: true, tokenSaved: true, roles: [...new Set(normalizedRoles)] });
  } catch (e) {
    console.log("[PUSH] register error:", e?.message || e);
    res.status(500).json({ message: "register failed" });
  }
});

// GET /api/push/debug (just to check how many tokens)
router.get("/debug", async (req, res) => {
  const count = await PushToken.countDocuments();
  const sample = await PushToken.find().limit(5).lean();
  res.json({ count, sample });
});

export default router;