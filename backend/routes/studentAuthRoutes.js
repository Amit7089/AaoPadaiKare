
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import Student from "../models/Student.js";
import studentAuth from "../middleware/studentAuth.js";

const router = express.Router();

// STUDENT REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, mobile, classNo, password } = req.body;

    if (!name || !email || !mobile || !classNo || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = String(mobile).trim();
    const selectedClass = Number(classNo);

    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 80 characters",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit Indian mobile number",
      });
    }

    if (!Number.isInteger(selectedClass) || selectedClass < 6 || selectedClass > 12) {
      return res.status(400).json({
        success: false,
        message: "Please select a class between 6 and 12",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const existingStudent = await Student.findOne({
      email: cleanEmail,
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const student = await Student.create({
      name: cleanName,
      email: cleanEmail,
      mobile: cleanMobile,
      classNo: selectedClass,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        mobile: student.mobile,
        classNo: student.classNo,
        membership: student.membership,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered",
      });
    }

    console.error("Student registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
});

// STUDENT LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const student = await Student.findOne({
      email: String(email).trim().toLowerCase(),
    }).select("+password");

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: student._id,
        role: "student",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        mobile: student.mobile,
        classNo: student.classNo,
        membership: student.membership,
      },
    });
  } catch (error) {
    console.error("Student login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
});

// GET LOGGED-IN STUDENT PROFILE
router.get("/me", studentAuth, async (req, res) => {
  try {
    const student = await Student.findById(req.studentId).select(
      "-password"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Student profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load student profile",
    });
  }
});

export default router;
