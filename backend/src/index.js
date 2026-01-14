import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "./db.js";
import Job from "./models/Job.js";
import "dotenv/config";

import pushRoutes from "./routes/push.js";
import PushToken from "./models/PushToken.js";
import { initFirebaseAdmin } from "./firebaseAdmin.js";

const admin = initFirebaseAdmin();
const app = express();

app.use(cors());
app.use(express.json({ limit: "80kb" }));
app.use("/api/push", pushRoutes);

await connectDB();

// ---------------- VALIDATION ----------------
const createSchema = z.object({
  name: z.string().min(2),
  companyName: z.string().optional().or(z.literal("")).optional(),
  phone: z.string().min(6),
  email: z.string().email(),
  city: z.string().min(2),
  jobRole: z.string().min(2),
  description: z.string().min(2),
  isUrgent: z.boolean().optional()
});

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

// ---------------- ROUTES ----------------

app.get("/", (req, res) => {
  res.json({ ok: true, message: "SAUDI JOB API Running" });
});

// Get Jobs
app.get("/api/jobs", async (req, res) => {
  const items = await Job.find().sort({ createdAt: -1 }).lean();
  res.json({ items, total: items.length });
});

// Create Job + SEND PUSH
app.post("/api/jobs", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false });

  const data = parsed.data;
  const now = new Date();

  const savedJob = await Job.create({
    ...data,
    companyName: data.companyName || data.name,
    isUrgent: !!data.isUrgent,
    createdAt: now,
    updatedAt: now,
    views: 0
  });

  // -------- PUSH NOTIFICATION ----------
  try {
    const role = String(savedJob.jobRole).trim().toLowerCase();

    const tokensDB = await PushToken.find({ roles: role }).lean();
    const tokens = tokensDB.map(t => t.token);

    console.log("[PUSH] Job Role:", role);
    console.log("[PUSH] Tokens found:", tokens.length);

    if (tokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: "New Job: " + savedJob.jobRole,
          body: savedJob.city + " • Tap to open"
        }
      });
    }
  } catch (e) {
    console.log("Push Error:", e.message);
  }
  // -------------------------------------

  res.status(201).json(savedJob);
});

// View counter
app.post("/api/jobs/:id/view", async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ ok: false });
  await Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
