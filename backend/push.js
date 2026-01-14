import express from "express";
import PushToken from "../models/PushToken.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { token, roles } = req.body;
  if (!token) return res.status(400).json({ error: "No token" });

  await PushToken.updateOne(
    { token },
    { $set: { roles } },
    { upsert: true }
  );

  res.json({ ok: true });
});

export default router;