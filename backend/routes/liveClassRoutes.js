
import express from "express";
import mongoose from "mongoose";

import LiveClass from "../models/LiveClass.js";
import Student from "../models/Student.js";

import adminAuth from "../middleware/adminAuth.js";
import studentAuth from "../middleware/studentAuth.js";

const router = express.Router();

// ======================================
// COMMON VALIDATION HELPERS
// ======================================

const isValidMeetingUrl = (url, platform) => {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") return false;

    if (platform === "zoom") {
      return (
        parsed.hostname === "zoom.us" ||
        parsed.hostname.endsWith(".zoom.us")
      );
    }

    if (platform === "google_meet") {
      return parsed.hostname === "meet.google.com";
    }

    return false;
  } catch {
    return false;
  }
};

const isValidRecordingUrl = (url) => {
  if (!url) return true;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const validateClassData = (body) => {
  const classNo = Number(body.classNo);
  const durationMinutes = Number(body.durationMinutes || 60);
  const scheduledAt = new Date(body.scheduledAt);

  if (
    !body.title?.trim() ||
    !Number.isInteger(classNo) ||
    classNo < 6 ||
    classNo > 12 ||
    !body.subject?.trim()
  ) {
    return "Valid title, class and subject are required";
  }

  if (!["zoom", "google_meet"].includes(body.platform)) {
    return "Invalid meeting platform";
  }

  if (!isValidMeetingUrl(body.meetingUrl, body.platform)) {
    return "Please enter a valid Zoom or Google Meet HTTPS link";
  }

  if (
    !Number.isFinite(scheduledAt.getTime()) ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 600
  ) {
    return "Valid date, time and duration are required";
  }

  if (
    body.recordingUrl !== undefined &&
    !isValidRecordingUrl(body.recordingUrl)
  ) {
    return "Recording URL must be a valid HTTPS URL";
  }

  if (
    body.status !== undefined &&
    !["scheduled", "live", "completed", "cancelled"].includes(
      body.status
    )
  ) {
    return "Invalid class status";
  }

  return null;
};

// ======================================
// ADMIN: CREATE LIVE CLASS
// ======================================

router.post("/", adminAuth, async (req, res) => {
  try {
    const error = validateClassData(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const liveClass = await LiveClass.create({
      title: req.body.title.trim(),
      classNo: Number(req.body.classNo),
      subject: req.body.subject.trim(),
      description: req.body.description || "",
      platform: req.body.platform,
      meetingUrl: req.body.meetingUrl.trim(),
      scheduledAt: new Date(req.body.scheduledAt),
      durationMinutes: Number(req.body.durationMinutes || 60),
      status: "scheduled",
      recordingUrl: "",
      createdBy: req.admin.id,
    });

    return res.status(201).json({
      success: true,
      message: "Live class created successfully",
      data: liveClass,
    });
  } catch (error) {
    console.error("Create live class error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not create live class",
    });
  }
});

// ======================================
// ADMIN: GET ALL LIVE CLASSES
// ======================================

router.get("/admin/all", adminAuth, async (req, res) => {
  try {
    const classes = await LiveClass.find()
      .sort({ scheduledAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    console.error("Admin live classes error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load live classes",
    });
  }
});

// ======================================
// ADMIN: UPDATE LIVE CLASS
// ======================================

router.put("/:id", adminAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid live class ID",
      });
    }

    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    const allowedFields = [
      "title",
      "classNo",
      "subject",
      "description",
      "platform",
      "meetingUrl",
      "scheduledAt",
      "durationMinutes",
      "status",
      "recordingUrl",
    ];

    const updatedData = {
      ...liveClass.toObject(),
    };

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updatedData[field] = req.body[field];
      }
    }

    const error = validateClassData(updatedData);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    liveClass.title = updatedData.title.trim();
    liveClass.classNo = Number(updatedData.classNo);
    liveClass.subject = updatedData.subject.trim();
    liveClass.description = updatedData.description || "";
    liveClass.platform = updatedData.platform;
    liveClass.meetingUrl = updatedData.meetingUrl.trim();
    liveClass.scheduledAt = new Date(updatedData.scheduledAt);
    liveClass.durationMinutes = Number(updatedData.durationMinutes);
    liveClass.status = updatedData.status;
    liveClass.recordingUrl = updatedData.recordingUrl || "";

    await liveClass.save();

    return res.json({
      success: true,
      message: "Live class updated successfully",
      data: liveClass,
    });
  } catch (error) {
    console.error("Update live class error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update live class",
    });
  }
});

// ======================================
// ADMIN: DELETE LIVE CLASS
// ======================================

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid live class ID",
      });
    }

    const liveClass = await LiveClass.findByIdAndDelete(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    return res.json({
      success: true,
      message: "Live class deleted successfully",
    });
  } catch (error) {
    console.error("Delete live class error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not delete live class",
    });
  }
});

// ======================================
// STUDENT: GET LIVE CLASSES
// ======================================

router.get("/", studentAuth, async (req, res) => {
  try {
    const classNo = Number(req.query.classNo);

    if (!Number.isInteger(classNo) || classNo < 6 || classNo > 12) {
      return res.status(400).json({
        success: false,
        message: "Valid class number is required",
      });
    }

    // Find logged-in student
    const student = await Student.findById(req.studentId)
      .select("memberships")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student account not found",
      });
    }

    // Check exact class Premium membership
    const now = new Date();

    const hasActiveMembership = (student.memberships || []).some(
      (membership) => {
        const expiry = new Date(membership.expiresAt);

        return (
          Number(membership.classNo) === classNo &&
          membership.status === "active" &&
          membership.expiresAt &&
          Number.isFinite(expiry.getTime()) &&
          expiry > now
        );
      }
    );

    if (!hasActiveMembership) {
      return res.status(403).json({
        success: false,
        requiresPremium: true,
        classNo,
        message: `Active Class ${classNo} Premium membership required`,
      });
    }

    // Fetch only requested class sessions
    const classes = await LiveClass.find({
      classNo,
      status: {
        $in: ["scheduled", "live", "completed"],
      },
    })
      .sort({ scheduledAt: 1 })
      .lean();

    // Hide meeting links for completed classes
    const safeClasses = classes.map((liveClass) => ({
      ...liveClass,
      meetingUrl:
        liveClass.status === "scheduled" ||
        liveClass.status === "live"
          ? liveClass.meetingUrl
          : "",
    }));

    return res.json({
      success: true,
      count: safeClasses.length,
      data: safeClasses,
    });
  } catch (error) {
    console.error("Student live classes error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load live classes",
    });
  }
});

export default router;
