
import express from "express";
import fs from "fs";
import path from "path";

import Note from "../models/Note.js";
import upload from "../middleware/upload.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Helper: Delete uploaded PDF safely
const deletePdfFile = (pdfUrl) => {
  if (!pdfUrl) return;

  const filename = path.basename(pdfUrl);
  const filePath = path.join(process.cwd(), "uploads", filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Helper: Remove newly uploaded PDF if request fails
const removeUploadedFile = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
};

// Helper: Validate YouTube URL
const isValidYouTubeUrl = (url) => {
  if (!url) return true;

  try {
    const parsedUrl = new URL(url);

    return (
      ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"].includes(parsedUrl.hostname) &&
      (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:")
    );
  } catch {
    return false;
  }
};

// GET: All notes - Public
router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.classNo) {
      const classNo = Number(req.query.classNo);

      if (
        !Number.isInteger(classNo) ||
        classNo < 6 ||
        classNo > 12
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid class number",
        });
      }

      filter.classNo = classNo;
    }

    if (req.query.subject) {
      filter.subject = req.query.subject;
    }

    if (req.query.chapter) {
      filter.chapter = req.query.chapter;
    }

    const notes = await Note.find(filter).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST: Add note - Admin only
router.post("/", adminAuth, (req, res) => {
  upload.single("pdf")(req, res, async (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    try {
      const {
        classNo,
        subject,
        chapter,
        title,
        content,
        youtubeUrl,
        isPremium,
      } = req.body;

      const numericClass = Number(classNo);
      const videoUrl = youtubeUrl?.trim() || "";

      if (
        !Number.isInteger(numericClass) ||
        numericClass < 6 ||
        numericClass > 12 ||
        !subject?.trim() ||
        !chapter?.trim() ||
        !title?.trim()
      ) {
        removeUploadedFile(req.file);

        return res.status(400).json({
          success: false,
          message:
            "Valid class, subject, chapter and title are required",
        });
      }

      if (!isValidYouTubeUrl(videoUrl)) {
        removeUploadedFile(req.file);

        return res.status(400).json({
          success: false,
          message: "Please enter a valid YouTube video URL",
        });
      }

      if (!content?.trim() && !req.file) {
        return res.status(400).json({
          success: false,
          message: "Please provide note text or a PDF file",
        });
      }

      const note = await Note.create({
        classNo: numericClass,
        subject: subject.trim(),
        chapter: chapter.trim(),
        title: title.trim(),
        content: content || "",
        pdfUrl: req.file
          ? `/uploads/${req.file.filename}`
          : "",
        pdfName: req.file
          ? req.file.originalname
          : "",
        youtubeUrl: videoUrl,
        isPremium: isPremium === "true",
      });

      res.status(201).json({
        success: true,
        message: "Note added successfully",
        data: note,
      });
    } catch (error) {
      removeUploadedFile(req.file);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });
});

// PUT: Update note - Admin only
router.put("/:id", adminAuth, (req, res) => {
  upload.single("pdf")(req, res, async (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    let oldPdfUrl = "";

    try {
      const note = await Note.findById(req.params.id);

      if (!note) {
        removeUploadedFile(req.file);

        return res.status(404).json({
          success: false,
          message: "Note not found",
        });
      }

      const {
        classNo,
        subject,
        chapter,
        title,
        content,
        youtubeUrl,
        isPremium,
      } = req.body;

      const numericClass = Number(classNo);
      const videoUrl = youtubeUrl?.trim() || "";

      // Validate fields
      if (
        !Number.isInteger(numericClass) ||
        numericClass < 6 ||
        numericClass > 12 ||
        !subject?.trim() ||
        !chapter?.trim() ||
        !title?.trim()
      ) {
        removeUploadedFile(req.file);

        return res.status(400).json({
          success: false,
          message:
            "Valid class, subject, chapter and title are required",
        });
      }

      if (!isValidYouTubeUrl(videoUrl)) {
        removeUploadedFile(req.file);

        return res.status(400).json({
          success: false,
          message: "Please enter a valid YouTube video URL",
        });
      }

      // Keep existing PDF if no new PDF is uploaded
      const hasPdf = req.file || note.pdfUrl;

      if (!content?.trim() && !hasPdf) {
        return res.status(400).json({
          success: false,
          message: "Please provide note text or a PDF file",
        });
      }

      // Store old PDF URL for deletion after successful update
      if (req.file) {
        oldPdfUrl = note.pdfUrl;
      }

      // Update note fields
      note.classNo = numericClass;
      note.subject = subject.trim();
      note.chapter = chapter.trim();
      note.title = title.trim();
      note.content = content || "";
      note.youtubeUrl = videoUrl;
      note.isPremium = isPremium === "true";

      // Replace PDF only if a new one is uploaded
      if (req.file) {
        note.pdfUrl = `/uploads/${req.file.filename}`;
        note.pdfName = req.file.originalname;
      }

      await note.save();

      // Delete old PDF after successful database update
      if (req.file && oldPdfUrl) {
        try {
          deletePdfFile(oldPdfUrl);
        } catch (fileError) {
          console.error(
            "Old PDF deletion failed:",
            fileError.message
          );
        }
      }

      res.json({
        success: true,
        message: "Note updated successfully",
        data: note,
      });
    } catch (error) {
      removeUploadedFile(req.file);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });
});

// DELETE: Delete note - Admin only
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    if (note.pdfUrl) {
      try {
        deletePdfFile(note.pdfUrl);
      } catch (fileError) {
        console.error(
          "PDF deletion failed:",
          fileError.message
        );
      }
    }

    await note.deleteOne();

    res.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
