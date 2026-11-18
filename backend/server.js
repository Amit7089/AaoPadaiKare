
import "dotenv/config";

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import syllabusRoutes from "./routes/syllabusRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import studentAuthRoutes from "./routes/studentAuthRoutes.js";
import membershipRoutes from "./routes/membershipRoutes.js";
import membershipPaymentRoutes from "./routes/membershipPaymentRoutes.js";
import liveClassRoutes from "./routes/liveClassRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import studentQuizRoutes from "./routes/studentQuizRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import questionPaperRoutes from "./routes/questionPaperRoutes.js";
import adminCourseRoutes from "./routes/adminCourseRoutes.js";
import adminCourseSubjectRoutes from "./routes/adminCourseSubjectRoutes.js";
import adminCourseLessonRoutes from "./routes/adminCourseLessonRoutes.js";
import studentCourseRoutes from "./routes/studentCourseRoutes.js";
import coursePaymentRoutes from "./routes/coursePaymentRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Hide Express information
app.disable("x-powered-by");

// Normalize frontend origins
const normalizeOrigin = (origin) =>
  origin.trim().replace(/\/+$/, "");

const allowedOrigins = [
  "http://localhost:5173",
  "https://aao-padai-kare.vercel.app",
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .map(normalizeOrigin);

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header
    // (e.g. server-to-server and health checks)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn("Blocked by CORS:", origin);

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
};

app.use(cors(corsOptions));

// Request body limits
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({
  extended: true,
  limit: "2mb",
}));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
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
app.use("/api/student", studentAuthRoutes);

app.use("/api/syllabus", syllabusRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/question-papers", questionPaperRoutes);


app.use("/api/live-classes", liveClassRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/student", studentQuizRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin/courses", adminCourseRoutes);
app.use("/api/admin/courses", adminCourseSubjectRoutes);
app.use("/api/admin/courses", adminCourseLessonRoutes);
app.use("/api/courses", studentCourseRoutes);
app.use("/api/course-payment", coursePaymentRoutes);

app.use("/api/membership/payment", membershipPaymentRoutes);
app.use("/api/membership", membershipRoutes);



// API not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin is not allowed",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Something went wrong on the server",
  });
});

// Start server
async function startServer() {
  try {
    // Required environment variables
    const requiredEnv = [
      "MONGODB_URI",
      "JWT_SECRET",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ];

    const missingEnv = requiredEnv.filter(
      (key) => !process.env[key]
    );

    if (missingEnv.length > 0) {
      throw new Error(
        `Missing environment variables: ${missingEnv.join(", ")}`
      );
    }

    // Connect database
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    // Start server
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
