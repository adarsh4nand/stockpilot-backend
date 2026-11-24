import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import mongoose from "mongoose";
import { User } from "../models/User.js";

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = "admin@stockpilot.dev";
  const exists = await User.findOne({ email });

  if (exists) {
    console.log("ℹ️ Admin already exists:", email);
  } else {
    await User.create({
      name: "Platform Admin",
      email,
      password: "Password123",
      role: "admin",
    });
    console.log("✅ Admin created → admin@stockpilot.dev / Password123");
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});