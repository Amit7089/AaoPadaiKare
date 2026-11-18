
import express from "express";
import mongoose from "mongoose";

import Course from "../models/Course.js";
import CourseSubject from "../models/CourseSubject.js";
import CourseLesson from "../models/CourseLesson.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// GET ALL COURSES
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Admin get courses error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch courses",
    });
  }
});

// GET SINGLE COURSE
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await Course.findById(req.params.id).lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const subjects = await CourseSubject.find({
      course: course._id,
    })
      .sort({ displayOrder: 1 })
      .lean();

    const lessons = await CourseLesson.find({
      course: course._id,
    })
      .sort({ displayOrder: 1 })
      .select("-content")
      .lean();

    return res.json({
      success: true,
      course,
      subjects,
      lessons,
    });
  } catch (error) {
    console.error("Admin get course error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch course details",
    });
  }
});

// CREATE COURSE
router.post("/", async (req, res) => {
  try {
    const {
      title,
      slug,
      examCode,
      category,
      targetClasses,
      shortDescription,
      description,
      eligibility,
      supportedLanguages,
      thumbnailUrl,
      price,
      compareAtPrice,
      durationDays,
      featured,
      displayOrder,
    } = req.body;

    if (
      !title?.trim() ||
      !slug?.trim() ||
      !shortDescription?.trim() ||
      !category ||
      !Array.isArray(targetClasses) ||
      targetClasses.length === 0 ||
      !Array.isArray(supportedLanguages) ||
      supportedLanguages.length === 0 ||
      price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required course details",
      });
    }

    const course = await Course.create({
      title,
      slug,
      examCode,
      category,
      targetClasses,
      shortDescription,
      description,
      eligibility,
      supportedLanguages,
      thumbnailUrl,
      price,
      compareAtPrice,
      durationDays,
      featured,
      displayOrder,
      createdBy: req.admin.id,
    });

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Create course error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A course with this slug already exists",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Could not create course",
    });
  }
});

// UPDATE COURSE
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const allowedFields = [
      "title",
      "slug",
      "examCode",
      "category",
      "targetClasses",
      "shortDescription",
      "description",
      "eligibility",
      "supportedLanguages",
      "thumbnailUrl",
      "price",
      "compareAtPrice",
      "durationDays",
      "featured",
      "displayOrder",
      "isPublished",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error("Update course error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Could not update course",
    });
  }
});

// PUBLISH / UNPUBLISH COURSE
router.patch("/:id/publish", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    if (typeof req.body.isPublished !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isPublished must be true or false",
      });
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isPublished: req.body.isPublished },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.json({
      success: true,
      message: req.body.isPublished
        ? "Course published successfully"
        : "Course unpublished successfully",
      course,
    });
  } catch (error) {
    console.error("Publish course error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not update course status",
    });
  }
});

// DELETE COURSE
router.delete("/:id", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    await session.withTransaction(async () => {
      const course = await Course.findById(req.params.id).session(session);

      if (!course) {
        const error = new Error("Course not found");
        error.statusCode = 404;
        throw error;
      }

      await CourseSubject.deleteMany(
        { course: course._id },
        { session }
      );

      await CourseLesson.deleteMany(
        { course: course._id },
        { session }
      );

      await Course.deleteOne(
        { _id: course._id },
        { session }
      );
    });

    return res.json({
      success: true,
      message: "Course and its subjects and lessons deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Could not delete course",
    });
  } finally {
    await session.endSession();
  }
});

export default router;
