
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import cloudinary from "../config/cloudinary.js";
import Note from "../models/Note.js";
import Student from "../models/Student.js";
import upload from "../middleware/upload.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

const PDF_RESOURCE_TYPE = "image";
const PDF_DELIVERY_TYPE = "authenticated";
const PDF_URL_VALIDITY_SECONDS = 10 * 60;

// ==========================================
// COMMON HELPERS
// ==========================================

const isValidPdf = (file) => {
  if (!file?.buffer || file.buffer.length < 5) return false;
  return file.buffer.subarray(0, 5).toString() === "%PDF-";
};

const getOriginalFileName = (file) => file?.originalname || "";

const isValidYouTubeUrl = (url) => {
  if (!url) return true;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    return (
      [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtu.be",
      ].includes(host) &&
      ["https:", "http:"].includes(parsed.protocol)
    );
  } catch {
    return false;
  }
};

const validateNoteFields = (body) => {
  const classNo = Number(body.classNo);
  const subject = body.subject?.trim();
  const chapter = body.chapter?.trim();
  const title = body.title?.trim();
  const youtubeUrl = body.youtubeUrl?.trim() || "";

  if (
    !Number.isInteger(classNo) ||
    classNo < 6 ||
    classNo > 12 ||
    !subject ||
    !chapter ||
    !title
  ) {
    return {
      valid: false,
      message: "Valid class, subject, chapter and title are required",
    };
  }

  if (!isValidYouTubeUrl(youtubeUrl)) {
    return {
      valid: false,
      message: "Please enter a valid YouTube video URL",
    };
  }

  return {
    valid: true,
    classNo,
    subject,
    chapter,
    title,
    youtubeUrl,
  };
};

// ==========================================
// CLOUDINARY PDF HELPERS
// ==========================================

const uploadPdfToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    if (!isValidPdf(file)) {
      return reject(new Error("Invalid PDF file"));
    }

    const uniqueName = `note-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "aao-padai-kare/notes",
        public_id: uniqueName,
        resource_type: PDF_RESOURCE_TYPE,
        type: PDF_DELIVERY_TYPE,
        format: "pdf",
      },
      (error, result) => {
        if (error) return reject(error);

        if (!result?.public_id) {
          return reject(new Error("PDF upload failed"));
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });

const deleteCloudinaryPdf = async (
  publicId,
  resourceType = PDF_RESOURCE_TYPE,
  deliveryType = PDF_DELIVERY_TYPE
) => {
  if (!publicId) return;

  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    type: deliveryType,
    invalidate: true,
  });
};

const generatePdfUrl = (note) => {
  if (
    !note?.pdfPublicId ||
    note.pdfDeliveryType !== PDF_DELIVERY_TYPE
  ) {
    return null;
  }

  const expiresAt =
    Math.floor(Date.now() / 1000) + PDF_URL_VALIDITY_SECONDS;

  return cloudinary.utils.private_download_url(
    note.pdfPublicId,
    "pdf",
    {
      resource_type: PDF_RESOURCE_TYPE,
      type: PDF_DELIVERY_TYPE,
      expires_at: expiresAt,
      attachment: false,
    }
  );
};

// ==========================================
// STUDENT MEMBERSHIP HELPERS
// ==========================================

const getStudentMembership = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      loggedIn: false,
      activeClassNos: new Set(),
    };
  }

  try {
    const token = authHeader.split(" ")[1];

    if (!token || !process.env.JWT_SECRET) {
      return {
        loggedIn: false,
        activeClassNos: new Set(),
      };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "student" || !decoded.id) {
      return {
        loggedIn: false,
        activeClassNos: new Set(),
      };
    }

    const student = await Student.findById(decoded.id)
      .select("memberships")
      .lean();

    if (!student) {
      return {
        loggedIn: false,
        activeClassNos: new Set(),
      };
    }

    const now = new Date();

    const activeClassNos = new Set(
      (student.memberships || [])
        .filter((membership) => {
          const expiry = new Date(membership.expiresAt);

          return (
            membership.status === "active" &&
            membership.expiresAt &&
            Number.isFinite(expiry.getTime()) &&
            expiry > now
          );
        })
        .map((membership) => Number(membership.classNo))
        .filter(
          (classNo) =>
            Number.isInteger(classNo) &&
            classNo >= 6 &&
            classNo <= 12
        )
    );

    return {
      loggedIn: true,
      activeClassNos,
    };
  } catch {
    return {
      loggedIn: false,
      activeClassNos: new Set(),
    };
  }
};

// ==========================================
// FIRST 3 FREE NOTES PER CLASS + SUBJECT
// ==========================================

const getFreeNoteIds = async (filter) => {
  const demoFilter = { ...filter };

  delete demoFilter.chapter;

  const allNotes = await Note.find(demoFilter)
    .select("_id classNo subject")
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  const freeNoteIds = new Set();
  const subjectCounts = new Map();

  for (const note of allNotes) {
    const key = `${note.classNo}-${note.subject}`;
    const count = subjectCounts.get(key) || 0;

    if (count < 3) {
      freeNoteIds.add(String(note._id));
    }

    subjectCounts.set(key, count + 1);
  }

  return freeNoteIds;
};

// ==========================================
// RESPONSE HELPERS
// ==========================================

// Locked notes: hide all protected content and PDF details.

const makeLockedNote = (note) => ({
  ...note,
  content: "",
  pdfUrl: "",
  pdfName: "",
  pdfPublicId: "",
  pdfResourceType: "",
  pdfDeliveryType: "",
  youtubeUrl: "",
  isPremium: true,
  isLocked: true,
  hasPdf: Boolean(note.pdfPublicId || note.pdfUrl),
});

// Student response: never expose internal Cloudinary identifiers
// or stored permanent PDF URLs.

const makeStudentNote = (note, extra = {}) => {
  const {
    pdfPublicId,
    pdfResourceType,
    pdfDeliveryType,
    pdfUrl,
    ...safeNote
  } = note;

  return {
    ...safeNote,
    pdfUrl: "",
    hasPdf: Boolean(pdfPublicId || pdfUrl),
    ...extra,
  };
};

// Admin response: retain admin note data but do not expose
// stored permanent PDF URL in list responses.

const makeAdminNote = (note) => ({
  ...note,
  pdfUrl: "",
  isLocked: false,
  hasPdf: Boolean(note.pdfPublicId || note.pdfUrl),
});

// ==========================================
// ADMIN: GET ALL NOTES
// ==========================================

router.get("/admin/all", adminAuth, async (req, res) => {
  try {
    const filter = {};

    if (req.query.classNo) {
      const classNo = Number(req.query.classNo);

      if (!Number.isInteger(classNo) || classNo < 6 || classNo > 12) {
        return res.status(400).json({
          success: false,
          message: "Invalid class number",
        });
      }

      filter.classNo = classNo;
    }

    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.chapter) filter.chapter = req.query.chapter;

    const [notes, freeNoteIds] = await Promise.all([
      Note.find(filter).sort({ createdAt: 1, _id: 1 }).lean(),
      getFreeNoteIds(filter),
    ]);

    const data = notes.map((note) => ({
      ...makeAdminNote(note),
      isPremium: !freeNoteIds.has(String(note._id)),
    }));

    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Admin get notes error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load admin notes",
    });
  }
});

// ==========================================
// ADMIN: GET SINGLE NOTE WITH TEMPORARY PDF URL
// ==========================================

router.get("/admin/:id", adminAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await Note.findById(req.params.id).lean();

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    let pdfUrl = "";

    if (note.pdfPublicId) {
      pdfUrl = generatePdfUrl(note);

      if (!pdfUrl) {
        return res.status(409).json({
          success: false,
          message:
            "This PDF needs to be re-uploaded using secure storage.",
          pdfMigrationRequired: true,
        });
      }
    }

    return res.json({
      success: true,
      data: {
        ...note,
        pdfUrl,
        hasPdf: Boolean(note.pdfPublicId || note.pdfUrl),
      },
    });
  } catch (error) {
    console.error("Admin get single note error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load note",
    });
  }
});

// ==========================================
// STUDENT: GET ALL NOTES
// ==========================================

router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.classNo) {
      const classNo = Number(req.query.classNo);

      if (!Number.isInteger(classNo) || classNo < 6 || classNo > 12) {
        return res.status(400).json({
          success: false,
          message: "Invalid class number",
        });
      }

      filter.classNo = classNo;
    }

    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.chapter) filter.chapter = req.query.chapter;

    const membership = await getStudentMembership(req);

    const [freeNoteIds, notes] = await Promise.all([
      getFreeNoteIds(filter),
      Note.find(filter).sort({ createdAt: 1, _id: 1 }).lean(),
    ]);

    const safeNotes = notes.map((note) => {
      const isFree = freeNoteIds.has(String(note._id));

      const hasPremium = membership.activeClassNos.has(
        Number(note.classNo)
      );

      if (!isFree && !hasPremium) {
        return makeLockedNote(note);
      }

      return makeStudentNote(note, {
        isPremium: !isFree,
        isLocked: false,
      });
    });

    return res.json({
      success: true,
      count: safeNotes.length,
      data: safeNotes,
      activePremiumClasses: [...membership.activeClassNos],
      loggedIn: membership.loggedIn,
    });
  } catch (error) {
    console.error("Get notes error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load notes",
    });
  }
});

// ==========================================
// STUDENT: GET SINGLE NOTE
// ==========================================

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await Note.findById(req.params.id).lean();

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    const membership = await getStudentMembership(req);

    const freeNoteIds = await getFreeNoteIds({
      classNo: note.classNo,
      subject: note.subject,
    });

    const isFree = freeNoteIds.has(String(note._id));

    const hasPremium = membership.activeClassNos.has(
      Number(note.classNo)
    );

    if (!isFree && !hasPremium) {
      return res.status(403).json({
        success: false,
        locked: true,
        requiresLogin: !membership.loggedIn,
        requiresPremium: membership.loggedIn,
        classNo: note.classNo,
        message: membership.loggedIn
          ? `Class ${note.classNo} Premium membership required`
          : "Please login to access this lecture",
      });
    }

    let pdfUrl = "";

    if (note.pdfPublicId) {
      pdfUrl = generatePdfUrl(note);

      if (!pdfUrl) {
        return res.status(409).json({
          success: false,
          message:
            "This PDF needs to be re-uploaded using secure storage.",
          pdfMigrationRequired: true,
        });
      }
    }

    return res.json({
      success: true,
      data: {
        ...makeStudentNote(note, {
          isPremium: !isFree,
          isLocked: false,
        }),
        pdfUrl,
      },
    });
  } catch (error) {
    console.error("Get single note error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load note",
    });
  }
});

// ==========================================
// ADMIN: ADD NOTE
// ==========================================

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
      const validation = validateNoteFields(req.body);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      const content = req.body.content || "";

      if (!content.trim() && !req.file) {
        return res.status(400).json({
          success: false,
          message: "Please provide note text or a PDF file",
        });
      }

      if (req.file) {
        if (!isValidPdf(req.file)) {
          return res.status(400).json({
            success: false,
            message: "Invalid PDF file content",
          });
        }

        uploadedPdf = await uploadPdfToCloudinary(req.file);
      }

      const note = await Note.create({
        classNo: validation.classNo,
        subject: validation.subject,
        chapter: validation.chapter,
        title: validation.title,
        content,
        pdfUrl: uploadedPdf?.secure_url || "",
        pdfName: getOriginalFileName(req.file),
        pdfPublicId: uploadedPdf?.public_id || "",
        pdfResourceType: uploadedPdf ? PDF_RESOURCE_TYPE : "raw",
        pdfDeliveryType: uploadedPdf
          ? PDF_DELIVERY_TYPE
          : "authenticated",
        youtubeUrl: validation.youtubeUrl,
      });

      const freeNoteIds = await getFreeNoteIds({
        classNo: note.classNo,
        subject: note.subject,
      });

      return res.status(201).json({
        success: true,
        message: "Note added successfully",
        data: {
          ...makeAdminNote(note.toObject()),
          isPremium: !freeNoteIds.has(String(note._id)),
        },
      });
    } catch (error) {
      console.error("Add note error:", error);

      if (uploadedPdf?.public_id) {
        try {
          await deleteCloudinaryPdf(uploadedPdf.public_id);
        } catch (deleteError) {
          console.error("PDF cleanup error:", deleteError);
        }
      }

      return res.status(500).json({
        success: false,
        message: "Failed to add note",
      });
    }
  });
});

// ==========================================
// ADMIN: UPDATE NOTE
// ==========================================

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
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid note ID",
        });
      }

      const note = await Note.findById(req.params.id);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: "Note not found",
        });
      }

      const validation = validateNoteFields(req.body);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      const content = req.body.content || "";

      if (
        !content.trim() &&
        !req.file &&
        !note.pdfPublicId &&
        !note.pdfUrl
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide note text or a PDF file",
        });
      }

      if (req.file) {
        if (!isValidPdf(req.file)) {
          return res.status(400).json({
            success: false,
            message: "Invalid PDF file content",
          });
        }

        uploadedPdf = await uploadPdfToCloudinary(req.file);
      }

      const oldPdf = {
        publicId: note.pdfPublicId,
        resourceType: note.pdfResourceType || "image",
        deliveryType: note.pdfDeliveryType || "upload",
      };

      note.classNo = validation.classNo;
      note.subject = validation.subject;
      note.chapter = validation.chapter;
      note.title = validation.title;
      note.content = content;
      note.youtubeUrl = validation.youtubeUrl;

      if (uploadedPdf) {
        note.pdfUrl = uploadedPdf.secure_url;
        note.pdfName = getOriginalFileName(req.file);
        note.pdfPublicId = uploadedPdf.public_id;
        note.pdfResourceType = PDF_RESOURCE_TYPE;
        note.pdfDeliveryType = PDF_DELIVERY_TYPE;
      }

      await note.save();

      if (uploadedPdf && oldPdf.publicId) {
        try {
          await deleteCloudinaryPdf(
            oldPdf.publicId,
            oldPdf.resourceType,
            oldPdf.deliveryType
          );
        } catch (deleteError) {
          console.error("Old PDF deletion error:", deleteError);
        }
      }

      const freeNoteIds = await getFreeNoteIds({
        classNo: note.classNo,
        subject: note.subject,
      });

      return res.json({
        success: true,
        message: "Note updated successfully",
        data: {
          ...makeAdminNote(note.toObject()),
          isPremium: !freeNoteIds.has(String(note._id)),
        },
      });
    } catch (error) {
      console.error("Update note error:", error);

      if (uploadedPdf?.public_id) {
        try {
          await deleteCloudinaryPdf(uploadedPdf.public_id);
        } catch (deleteError) {
          console.error("New PDF cleanup error:", deleteError);
        }
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update note",
      });
    }
  });
});

// ==========================================
// ADMIN: DELETE NOTE
// ==========================================

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

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
          note.pdfResourceType || "image",
          note.pdfDeliveryType || "upload"
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
      message: "Failed to delete note",
    });
  }
});

export default router;
