
import "dotenv/config";

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import syllabusRoutes from "./routes/syllabusRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import studentAuthRoutes from "./routes/studentAuthRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://aao-padai-kare.vercel.app",
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/+$/, ""));

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.log("Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

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

// Not found handler
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
      throw new Error("MONGODB_URI is missing in environment variables");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in environment variables");
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET) {
      throw new Error("Cloudinary environment variables are missing");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
      console.log("Allowed frontend origins:", allowedOrigins);
    });
  } catch (error) {
    console.error("Backend startup error:", error.message);
    process.exit(1);
  }
}

startServer();
