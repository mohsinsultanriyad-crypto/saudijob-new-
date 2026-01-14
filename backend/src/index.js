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

// ✅ routes after app created
app.use("/api/push", pushRoutes);

await connectDB();

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

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  companyName: z.string().optional().or(z.literal("")).optional(),
  phone: z.string().min(6).optional(),
  city: z.string().min(2).optional(),
  jobRole: z.string().min(2).optional(),
  description: z.string().min(2).optional(),
  isUrgent: z.boolean().optional()
});

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function buildFilters({ city, role, q, email }) {
  const filter = {};
  if (city) filter.city = city;
  if (role) filter.jobRole = role;
  if (email) filter.email = email;

  if (q) {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ jobRole: re }, { city: re }, { companyName: re }];
  }
  return filter;
}

app.get("/", (req, res) => res.json({ ok: true, message: "SAUDI JOB API running" }));

app.get("/api/jobs", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 50);
  const skip = Math.max(parseInt(req.query.skip || "0", 10), 0);

  const city = (req.query.city || "").trim();
  const role = (req.query.role || "").trim();
  const q = (req.query.q || "").trim();

  const now = Date.now();
  const filter = buildFilters({
    city: city && city !== "All" ? city : "",
    role: role && role !== "All" ? role : "",
    q: q || ""
  });

  const total = await Job.countDocuments(filter);

  const raw = await Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

  const items = raw
    .map((j) => {
      const urgentActive = !!(j.isUrgent && j.urgentUntil && new Date(j.urgentUntil).getTime() > now);
      return { ...j, urgentActive, isUrgent: urgentActive ? j.isUrgent : false };
    })
    .sort((a, b) => {
      if (a.urgentActive && !b.urgentActive) return -1;
      if (!a.urgentActive && b.urgentActive) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  res.json({ items, total });
});

// ✅ Create job + send push
app.post("/api/jobs", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation error", errors: parsed.error.flatten() });
  }

  const data = parsed.data;
  const now = new Date();
  const urgentUntil = data.isUrgent ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : null;

  const savedJob = await Job.create({
    name: data.name,
    companyName: (data.companyName || "").trim() ? data.companyName : data.name,
    phone: data.phone,
    email: data.email,
    city: data.city,
    jobRole: data.jobRole,
    description: data.description,
    isUrgent: !!data.isUrgent,
    urgentUntil,
    views: 0,
    createdAt: now,
    updatedAt: now
  });

  // ✅ SEND PUSH HERE (role-based)
  try {
    const role = String(savedJob.jobRole || "").trim().toLowerCase();

    // IMPORTANT: PushToken schema should store roles in lowercase
    const tokensDB = await PushToken.find({ roles: role }).lean();
    const tokens = (tokensDB || []).map((t) => t.token).filter(Boolean);

    if (tokens.length > 0) {
      const resp = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: "New Job: " + savedJob.jobRole,
          body: savedJob.city + " • Tap to open"
        },
        data: {
          jobId: String(savedJob._id),
          jobRole: String(savedJob.jobRole),
          city: String(savedJob.city)
        }
      });

      // optional: remove bad tokens automatically
      const badTokens = [];
      resp.responses.forEach((r, i) => {
        if (!r.success) badTokens.push(tokens[i]);
      });
      if (badTokens.length) {
        await PushToken.deleteMany({ token: { $in: badTokens } });
      }
    }
  } catch (e) {
    console.log("Push send error:", e?.message || e);
  }

  res.status(201).json(savedJob);
});

app.post("/api/jobs/:id/view", async (req, res) => {
  const id = req.params.id;
  if (!isValidId(id)) return res.status(400).json({ message: "Invalid id" });
  await Job.findByIdAndUpdate(id, { $inc: { views: 1 } });
  res.json({ ok: true });
});

app.put("/api/jobs/:id", async (req, res) => {
  const id = req.params.id;
  if (!isValidId(id)) return res.status(400).json({ message: "Invalid id" });

  const email = String(req.query.email || "").trim().toLowerCase();
  const job = await Job.findById(id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  if (job.email.toLowerCase() !== email) {
    return res.status(403).json({ message: "Email does not match" });
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation error", errors: parsed.error.flatten() });
  }

  const patch = parsed.data;
  const now = new Date();

  if (patch.isUrgent === true) {
    job.isUrgent = true;
    job.urgentUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  } else if (patch.isUrgent === false) {
    job.isUrgent = false;
    job.urgentUntil = null;
  }

  if (typeof patch.name === "string") job.name = patch.name;
  if (typeof patch.companyName === "string")
    job.companyName = patch.companyName.trim() ? patch.companyName : job.companyName;
  if (typeof patch.phone === "string") job.phone = patch.phone;
  if (typeof patch.city === "string") job.city = patch.city;
  if (typeof patch.jobRole === "string") job.jobRole = patch.jobRole;
  if (typeof patch.description === "string") job.description = patch.description;

  job.updatedAt = now;
  await job.save();

  res.json(job);
});

app.delete("/api/jobs/:id", async (req, res) => {
  const id = req.params.id;
  if (!isValidId(id)) return res.status(400).json({ message: "Invalid id" });

  const email = String(req.query.email || "").trim().toLowerCase();
  const job = await Job.findById(id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  if (job.email.toLowerCase() !== email) {
    return res.status(403).json({ message: "Email does not match" });
  }

  await job.deleteOne();
  res.json({ ok: true });
});

app.get("/api/my-posts", async (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ message: "email required" });

  const limit = Math.min(parseInt(req.query.limit || "20", 10), 50);
  const skip = Math.max(parseInt(req.query.skip || "0", 10), 0);

  const filter = buildFilters({ email });
  const total = await Job.countDocuments(filter);

  const items = await Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  res.json({ items, total });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running:", PORT));
