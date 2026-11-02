
import express from "express";
import Syllabus from "../models/Syllabus.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Add new chapter - Admin only
router.post("/", adminAuth, async (req, res) => {
  try {
    const { classNo, subject, chapter } = req.body;

    if (
      !classNo ||
      !subject?.trim() ||
      !chapter?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Class, subject and chapter are required",
      });
    }

    const newChapter = await Syllabus.create({
      classNo: Number(classNo),
      subject: subject.trim(),
      chapter: chapter.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Chapter added successfully",
      data: newChapter,
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "This chapter already exists"
          : error.message,
    });
  }
});

// Get all chapters - Public
router.get("/", async (req, res) => {
  try {
    const chapters = await Syllabus.find().sort({
      classNo: 1,
      subject: 1,
    });

    res.json({
      success: true,
      count: chapters.length,
      data: chapters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get chapters by class - Public
router.get("/class/:classNo", async (req, res) => {
  try {
    const classNo = Number(req.params.classNo);

    if (
      !Number.isInteger(classNo) ||
      classNo < 6 ||
      classNo > 12
    ) {
      return res.status(400).json({
        success: false,
        message: "Class must be between 6 and 12",
      });
    }

    const chapters = await Syllabus.find({ classNo }).sort({
      subject: 1,
      chapter: 1,
    });

    res.json({
      success: true,
      count: chapters.length,
      data: chapters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete chapter - Admin only
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const chapter = await Syllabus.findByIdAndDelete(req.params.id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found",
      });
    }

    res.json({
      success: true,
      message: "Chapter deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
