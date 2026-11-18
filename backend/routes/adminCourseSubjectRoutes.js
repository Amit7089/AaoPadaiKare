
import express from "express";
import mongoose from "mongoose";

import Course from "../models/Course.js";
import CourseSubject from "../models/CourseSubject.js";
import CourseLesson from "../models/CourseLesson.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.use(adminAuth);

const validId = (id) => mongoose.isValidObjectId(id);

// GET SUBJECTS OF A COURSE
router.get("/:courseId/subjects", async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!validId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await Course.findById(courseId).select("_id");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const subjects = await CourseSubject.find({ course: courseId })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      subjects,
    });
  } catch (error) {
    console.error("Get course subjects error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch subjects",
    });
  }
});

// ADD SUBJECT
router.post("/:courseId/subjects", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { name, description = "", displayOrder = 0 } = req.body;

    if (!validId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject name is required",
      });
    }

    const course = await Course.findById(courseId).select("_id");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const subject = await CourseSubject.create({
      course: courseId,
      name: name.trim(),
      description,
      displayOrder,
    });

    return res.status(201).json({
      success: true,
      message: "Subject added successfully",
      subject,
    });
  } catch (error) {
    console.error("Add subject error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Could not add subject",
    });
  }
});

// UPDATE SUBJECT
router.put("/subjects/:subjectId", async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!validId(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    const allowedFields = ["name", "description", "displayOrder", "isPublished"];
    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined && !updates.name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject name cannot be empty",
      });
    }

    const subject = await CourseSubject.findByIdAndUpdate(
      subjectId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.json({
      success: true,
      message: "Subject updated successfully",
      subject,
    });
  } catch (error) {
    console.error("Update subject error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Could not update subject",
    });
  }
});

// DELETE SUBJECT AND ITS LESSONS
router.delete("/subjects/:subjectId", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { subjectId } = req.params;

    if (!validId(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    await session.withTransaction(async () => {
      const subject = await CourseSubject.findById(subjectId).session(session);

      if (!subject) {
        const error = new Error("Subject not found");
        error.statusCode = 404;
        throw error;
      }

      await CourseLesson.deleteMany(
        { subject: subject._id, course: subject.course },
        { session }
      );

      await CourseSubject.deleteOne(
        { _id: subject._id },
        { session }
      );
    });

    return res.json({
      success: true,
      message: "Subject and its lessons deleted successfully",
    });
  } catch (error) {
    console.error("Delete subject error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Could not delete subject",
    });
  } finally {
    await session.endSession();
  }
});

export default router;
