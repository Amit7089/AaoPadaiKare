
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";

import syllabusRoutes from "./routes/syllabusRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import studentAuthRoutes from "./routes/studentAuthRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

// Body parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Uploaded PDF files
app.use("/uploads", express.static(path.resolve("uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Aao Padai Kare backend is running!",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "not connected",
  });
});

// API routes
app.use("/api/admin", adminAuthRoutes);
app.use("/api/syllabus", syllabusRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/student", studentAuthRoutes);

// Not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    success: false,
    message: "Something went wrong on the server",
  });
});

// Start server
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env file");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env file");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup error:", error.message);
    process.exit(1);
  }
}

startServer();
