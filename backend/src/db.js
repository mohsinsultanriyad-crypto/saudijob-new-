import mongoose from "mongoose";

export async function connectDB() {
  const MONGO_URL = process.env.MONGO_URL;
  if (!MONGO_URL) {
    console.error("Missing MONGO_URL");
    process.exit(1);
  }
  await mongoose.connect(MONGO_URL);
  console.log("MongoDB connected");
}
