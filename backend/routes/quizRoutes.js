
import express from "express";
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Validate quiz data
const validateQuizData = (data) => {
  const {
    title,
    classNo,
    subject,
    chapter,
    durationMinutes,
    passingMarks,
    questions,
  } = data;

  if (!title?.trim()) return "Quiz title is required.";

  if (
    !Number.isInteger(Number(classNo)) ||
    Number(classNo) < 6 ||
    Number(classNo) > 12
  ) {
    return "Class must be between 6 and 12.";
  }

  if (!subject?.trim()) return "Subject is required.";
  if (!chapter?.trim()) return "Chapter is required.";

  if (
    !Number.isInteger(Number(durationMinutes)) ||
    Number(durationMinutes) < 1
  ) {
    return "Duration must be at least 1 minute.";
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return "At least one question is required.";
  }

  for (const question of questions) {
    if (!question.questionText?.trim()) {
      return "Every question must have question text.";
    }

    if (
      !Array.isArray(question.options) ||
      question.options.length !== 4 ||
      question.options.some((option) => !option?.trim())
    ) {
      return "Every question must have exactly 4 non-empty options.";
    }

    if (
      !Number.isInteger(Number(question.correctAnswerIndex)) ||
      Number(question.correctAnswerIndex) < 0 ||
      Number(question.correctAnswerIndex) > 3
    ) {
      return "Correct answer index must be between 0 and 3.";
    }

    if (
      !Number.isInteger(Number(question.marks ?? 1)) ||
      Number(question.marks ?? 1) < 1
    ) {
      return "Question marks must be at least 1.";
    }
  }

  const totalMarks = questions.reduce(
    (total, question) => total + Number(question.marks ?? 1),
    0
  );

  if (
    !Number.isFinite(Number(passingMarks)) ||
    Number(passingMarks) < 0 ||
    Number(passingMarks) > totalMarks
  ) {
    return "Passing marks cannot exceed total marks.";
  }

  return null;
};

// Create Quiz - Admin
router.post("/", adminAuth, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      classNo: Number(req.body.classNo),
      durationMinutes: Number(req.body.durationMinutes),
      passingMarks: Number(req.body.passingMarks ?? 0),
    };

    const error = validateQuizData(payload);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const quiz = await Quiz.create({
      ...payload,
      isPublished: false,
      createdBy: req.admin.id,
    });

    return res.status(201).json({
      success: true,
      message: "Quiz created successfully.",
      quiz,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create quiz.",
    });
  }
});

// Get all quizzes - Admin (hide correct answers)
router.get("/admin/all", adminAuth, async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .select("-questions.correctAnswerIndex")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      quizzes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quizzes.",
    });
  }
});

// Get single quiz for editing - Admin only
// Correct answers are returned only through this protected route.
router.get("/admin/:id/edit", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID.",
      });
    }

    const quiz = await Quiz.findById(id).lean();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found.",
      });
    }

    return res.json({
      success: true,
      quiz,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quiz for editing.",
    });
  }
});

// Update Quiz - Admin
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID.",
      });
    }

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found.",
      });
    }

    // Allow only supported fields to be updated.
    const allowedFields = [
      "title",
      "description",
      "classNo",
      "subject",
      "chapter",
      "durationMinutes",
      "passingMarks",
      "questions",
      "isPublished",
    ];

    const updatedData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updatedData[field] = req.body[field];
      }
    }

    const finalData = {
      title: updatedData.title ?? quiz.title,
      description: updatedData.description ?? quiz.description,
      classNo: Number(updatedData.classNo ?? quiz.classNo),
      subject: updatedData.subject ?? quiz.subject,
      chapter: updatedData.chapter ?? quiz.chapter,
      durationMinutes: Number(
        updatedData.durationMinutes ?? quiz.durationMinutes
      ),
      passingMarks: Number(
        updatedData.passingMarks ?? quiz.passingMarks
      ),
      questions: updatedData.questions ?? quiz.questions,
      isPublished: updatedData.isPublished ?? quiz.isPublished,
    };

    if (
      typeof finalData.isPublished !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid publish status.",
      });
    }

    const error = validateQuizData(finalData);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    Object.assign(quiz, finalData);
    await quiz.save();

    return res.json({
      success: true,
      message: "Quiz updated successfully.",
      quiz,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update quiz.",
    });
  }
});

// Delete Quiz - Admin
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID.",
      });
    }

    const quiz = await Quiz.findByIdAndDelete(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found.",
      });
    }

    return res.json({
      success: true,
      message: "Quiz deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete quiz.",
    });
  }
});

export default router;
