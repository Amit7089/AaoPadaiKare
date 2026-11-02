
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

dotenv.config();

async function createAdmin() {
  try {
    if (
      !process.env.MONGODB_URI ||
      !process.env.ADMIN_EMAIL ||
      !process.env.ADMIN_PASSWORD
    ) {
      throw new Error("MongoDB or admin environment variables are missing");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("Admin account already exists:", email);
      return;
    }

    if (process.env.ADMIN_PASSWORD.length < 12) {
      throw new Error("Admin password must be at least 12 characters");
    }

    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD,
      12
    );

    await Admin.create({
      name: "Administrator",
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin account created successfully:", email);
  } catch (error) {
    console.error("Admin setup error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
