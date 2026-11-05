
import express from "express";

import cloudinary from "../config/cloudinary.js";
import Note from "../models/Note.js";
import upload from "../middleware/upload.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Original filename
const getOriginalFileName = (file) => {
  return file?.originalname || "";
};

// Upload PDF to Cloudinary for browser preview
const uploadPdfToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!file?.buffer) {
      return reject(new Error("PDF file buffer is missing"));
    }

    const uniqueName = `note-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "aao-padai-kare/notes",
        public_id: uniqueName,
        resource_type: "image",
        format: "pdf",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary PDF upload error:", error);
          return reject(error);
        }

        if (!result?.secure_url || !result?.public_id) {
          return reject(new Error("Cloudinary PDF URL was not returned"));
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};

// Delete PDF from Cloudinary
const deleteCloudinaryPdf = async (
  publicId,
  resourceType = "raw"
) => {
  if (!publicId) return;

  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    type: "upload",
  });
};

// Validate YouTube URL
const isValidYouTubeUrl = (url) => {
  if (!url) return true;

  try {
    const parsedUrl = new URL(url);

    return (
      [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtu.be",
      ].includes(parsedUrl.hostname) &&
      ["https:", "http:"].includes(parsedUrl.protocol)
    );
  } catch {
    return false;
  }
};

// Validate note fields
const validateNoteFields = (body) => {
  const {
    classNo,
    subject,
    chapter,
    title,
    youtubeUrl,
  } = body;

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
    return {
      valid: false,
      message: "Valid class, subject, chapter and title are required",
    };
  }

  if (!isValidYouTubeUrl(videoUrl)) {
    return {
      valid: false,
      message: "Please enter a valid YouTube video URL",
    };
  }

  return {
    valid: true,
    numericClass,
    videoUrl,
  };
};

// GET: All notes
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

    return res.json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    console.error("Get notes error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST: Add note
router.post("/", adminAuth, (req, res) => {
  upload.single("pdf")(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        message: uploadError.message,
      });
    }

    let uploadedPdf = null;

    try {
      const {
        classNo,
        subject,
        chapter,
        title,
        content,
        isPremium,
      } = req.body;

      const validation = validateNoteFields(req.body);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      if (!content?.trim() && !req.file) {
        return res.status(400).json({
          success: false,
          message: "Please provide note text or a PDF file",
        });
      }

      if (req.file) {
        uploadedPdf = await uploadPdfToCloudinary(req.file);
      }

      const note = await Note.create({
        classNo: validation.numericClass,
        subject: subject.trim(),
        chapter: chapter.trim(),
        title: title.trim(),
        content: content || "",
        pdfUrl: uploadedPdf?.secure_url || "",
        pdfName: getOriginalFileName(req.file),
        pdfPublicId: uploadedPdf?.public_id || "",
        pdfResourceType: uploadedPdf ? "image" : "raw",
        youtubeUrl: validation.videoUrl,
        isPremium: isPremium === "true",
      });

      return res.status(201).json({
        success: true,
        message: "Note added successfully",
        data: note,
      });
    } catch (error) {
      console.error("Add note error:", error);

      if (uploadedPdf?.public_id) {
        try {
          await deleteCloudinaryPdf(uploadedPdf.public_id, "image");
        } catch (deleteError) {
          console.error("PDF cleanup error:", deleteError);
        }
      }

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to add note",
      });
    }
  });
});

// PUT: Update note
router.put("/:id", adminAuth, (req, res) => {
  upload.single("pdf")(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        message: uploadError.message,
      });
    }

    let uploadedPdf = null;

    try {
      const note = await Note.findById(req.params.id);

      if (!note) {
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
        isPremium,
      } = req.body;

      const validation = validateNoteFields(req.body);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      if (!content?.trim() && !req.file && !note.pdfUrl) {
        return res.status(400).json({
          success: false,
          message: "Please provide note text or a PDF file",
        });
      }

      // Upload replacement PDF first
      if (req.file) {
        uploadedPdf = await uploadPdfToCloudinary(req.file);
      }

      const oldPdfPublicId = note.pdfPublicId;
      const oldPdfResourceType = note.pdfResourceType || "raw";

      note.classNo = validation.numericClass;
      note.subject = subject.trim();
      note.chapter = chapter.trim();
      note.title = title.trim();
      note.content = content || "";
      note.youtubeUrl = validation.videoUrl;
      note.isPremium = isPremium === "true";

      if (uploadedPdf) {
        note.pdfUrl = uploadedPdf.secure_url;
        note.pdfName = getOriginalFileName(req.file);
        note.pdfPublicId = uploadedPdf.public_id;
        note.pdfResourceType = "image";
      }

      await note.save();

      // Delete previous PDF after successful save
      if (uploadedPdf && oldPdfPublicId) {
        try {
          await deleteCloudinaryPdf(
            oldPdfPublicId,
            oldPdfResourceType
          );
        } catch (deleteError) {
          console.error("Old PDF deletion error:", deleteError);
        }
      }

      return res.json({
        success: true,
        message: "Note updated successfully",
        data: note,
      });
    } catch (error) {
      console.error("Update note error:", error);

      if (uploadedPdf?.public_id) {
        try {
          await deleteCloudinaryPdf(uploadedPdf.public_id, "image");
        } catch (deleteError) {
          console.error("New PDF cleanup error:", deleteError);
        }
      }

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to update note",
      });
    }
  });
});

// DELETE: Delete note
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    if (note.pdfPublicId) {
      try {
        await deleteCloudinaryPdf(
          note.pdfPublicId,
          note.pdfResourceType || "raw"
        );
      } catch (deleteError) {
        console.error("Cloudinary PDF deletion error:", deleteError);

        return res.status(500).json({
          success: false,
          message: "PDF could not be deleted from Cloudinary",
        });
      }
    }

    await note.deleteOne();

    return res.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete note",
    });
  }
});

export default router;
