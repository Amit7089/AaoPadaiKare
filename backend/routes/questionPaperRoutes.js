
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import cloudinary from "../config/cloudinary.js";
import QuestionPaper from "../models/QuestionPaper.js";
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

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  return value === true || value === "true";
};

const validatePaperFields = (body) => {
  const classNo = Number(body.classNo);
  const year = Number(body.year);
  const title = body.title?.trim();
  const subject = body.subject?.trim();
  const paperType = body.paperType;
  const accessType = body.accessType || "free";
  const description = body.description?.trim() || "";

  if (
    !Number.isInteger(classNo) ||
    classNo < 6 ||
    classNo > 12
  ) {
    return { valid: false, message: "Invalid class number" };
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { valid: false, message: "Invalid paper year" };
  }

  if (!title || !subject) {
    return {
      valid: false,
      message: "Title and subject are required",
    };
  }

  if (!["question-paper", "solved-paper"].includes(paperType)) {
    return {
      valid: false,
      message: "Invalid paper type",
    };
  }

  if (!["free", "premium"].includes(accessType)) {
    return {
      valid: false,
      message: "Invalid access type",
    };
  }

  return {
    valid: true,
    classNo,
    year,
    title,
    subject,
    paperType,
    accessType,
    description,
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

    const uniqueName = `paper-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "aao-padai-kare/question-papers",
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

const generatePdfUrl = (paper) => {
  if (
    !paper?.pdfPublicId ||
    paper.pdfDeliveryType !== PDF_DELIVERY_TYPE
  ) {
    return null;
  }

  const expiresAt =
    Math.floor(Date.now() / 1000) + PDF_URL_VALIDITY_SECONDS;

  return cloudinary.utils.private_download_url(
    paper.pdfPublicId,
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
// STUDENT MEMBERSHIP HELPER
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
// RESPONSE HELPERS
// ==========================================

const makeAdminPaper = (paper) => ({
  ...paper,
  pdfUrl: "",
  hasPdf: Boolean(paper.pdfPublicId || paper.pdfUrl),
});

const makeStudentPaper = (paper, extra = {}) => {
  const {
    pdfUrl,
    pdfPublicId,
    pdfResourceType,
    pdfDeliveryType,
    ...safePaper
  } = paper;

  return {
    ...safePaper,
    pdfUrl: "",
    hasPdf: Boolean(pdfPublicId || pdfUrl),
    ...extra,
  };
};

const makeLockedPaper = (paper) => ({
  _id: paper._id,
  title: paper.title,
  classNo: paper.classNo,
  subject: paper.subject,
  year: paper.year,
  paperType: paper.paperType,
  description: "",
  accessType: "premium",
  isPublished: paper.isPublished,
  hasPdf: Boolean(paper.pdfPublicId || paper.pdfUrl),
  isLocked: true,
});

// ==========================================
// ADMIN: GET ALL PAPERS
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

    if (req.query.year) {
      const year = Number(req.query.year);

      if (!Number.isInteger(year)) {
        return res.status(400).json({
          success: false,
          message: "Invalid year",
        });
      }

      filter.year = year;
    }

    if (req.query.paperType) {
      filter.paperType = req.query.paperType;
    }

    const papers = await QuestionPaper.find(filter)
      .sort({ year: -1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: papers.length,
      data: papers.map(makeAdminPaper),
    });
  } catch (error) {
    console.error("Admin get papers error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load question papers",
    });
  }
});

// ==========================================
// ADMIN: GET SINGLE PAPER
// ==========================================

router.get("/admin/:id", adminAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid paper ID",
      });
    }

    const paper = await QuestionPaper.findById(req.params.id).lean();

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: "Question paper not found",
      });
    }

    let pdfUrl = "";

    if (paper.pdfPublicId) {
      pdfUrl = generatePdfUrl(paper);

      if (!pdfUrl) {
        return res.status(409).json({
          success: false,
          message: "This PDF needs to be re-uploaded using secure storage.",
          pdfMigrationRequired: true,
        });
      }
    }

    return res.json({
      success: true,
      data: {
        ...paper,
        pdfUrl,
        hasPdf: Boolean(paper.pdfPublicId || paper.pdfUrl),
      },
    });
  } catch (error) {
    console.error("Admin get single paper error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load question paper",
    });
  }
});

// ==========================================
// STUDENT: GET PUBLISHED PAPERS
// ==========================================

router.get("/", async (req, res) => {
  try {
    const filter = { isPublished: true };

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

    if (req.query.year) {
      const year = Number(req.query.year);

      if (!Number.isInteger(year)) {
        return res.status(400).json({
          success: false,
          message: "Invalid year",
        });
      }

      filter.year = year;
    }

    if (req.query.paperType) {
      if (!["question-paper", "solved-paper"].includes(req.query.paperType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid paper type",
        });
      }

      filter.paperType = req.query.paperType;
    }

    const membership = await getStudentMembership(req);

    const papers = await QuestionPaper.find(filter)
      .sort({ year: -1, createdAt: -1 })
      .lean();

    const safePapers = papers.map((paper) => {
      const hasPremium = membership.activeClassNos.has(
        Number(paper.classNo)
      );

      if (paper.accessType === "premium" && !hasPremium) {
        return makeLockedPaper(paper);
      }

      return makeStudentPaper(paper, {
        isLocked: false,
      });
    });

    return res.json({
      success: true,
      count: safePapers.length,
      data: safePapers,
      activePremiumClasses: [...membership.activeClassNos],
      loggedIn: membership.loggedIn,
    });
  } catch (error) {
    console.error("Get question papers error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load question papers",
    });
  }
});

// ==========================================
// STUDENT: GET SINGLE PAPER
// ==========================================

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid paper ID",
      });
    }

    const paper = await QuestionPaper.findOne({
      _id: req.params.id,
      isPublished: true,
    }).lean();

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: "Question paper not found",
      });
    }

    const membership = await getStudentMembership(req);

    const hasPremium = membership.activeClassNos.has(
      Number(paper.classNo)
    );

    if (paper.accessType === "premium" && !hasPremium) {
      return res.status(403).json({
        success: false,
        locked: true,
        requiresLogin: !membership.loggedIn,
        requiresPremium: membership.loggedIn,
        classNo: paper.classNo,
        message: membership.loggedIn
          ? `Class ${paper.classNo} Premium membership required`
          : "Please login to access this paper",
      });
    }

    let pdfUrl = "";

    if (paper.pdfPublicId) {
      pdfUrl = generatePdfUrl(paper);

      if (!pdfUrl) {
        return res.status(409).json({
          success: false,
          message: "This PDF needs to be re-uploaded using secure storage.",
          pdfMigrationRequired: true,
        });
      }
    }

    return res.json({
      success: true,
      data: {
        ...makeStudentPaper(paper, {
          isLocked: false,
        }),
        pdfUrl,
      },
    });
  } catch (error) {
    console.error("Get single question paper error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load question paper",
    });
  }
});

// ==========================================
// ADMIN: ADD QUESTION PAPER
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
      const validation = validatePaperFields(req.body);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a PDF file",
        });
      }

      if (!isValidPdf(req.file)) {
        return res.status(400).json({
          success: false,
          message: "Invalid PDF file content",
        });
      }

      uploadedPdf = await uploadPdfToCloudinary(req.file);

      const paper = await QuestionPaper.create({
        ...validation,
        pdfUrl: uploadedPdf.secure_url || "",
        pdfName: getOriginalFileName(req.file),
        pdfPublicId: uploadedPdf.public_id,
        pdfResourceType: PDF_RESOURCE_TYPE,
        pdfDeliveryType: PDF_DELIVERY_TYPE,
        isPublished: parseBoolean(req.body.isPublished, false),
        createdBy: req.admin.id,
      });

      return res.status(201).json({
        success: true,
        message: "Question paper added successfully",
        data: makeAdminPaper(paper.toObject()),
      });
    } catch (error) {
      console.error("Add question paper error:", error);

      if (uploadedPdf?.public_id) {
        try {
          await deleteCloudinaryPdf(uploadedPdf.public_id);
        } catch (deleteError) {
          console.error("PDF cleanup error:", deleteError);
        }
      }

      return res.status(500).json({
        success: false,
        message: "Failed to add question paper",
      });
    }
  });
});

// ==========================================
// ADMIN: UPDATE QUESTION PAPER
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
          message: "Invalid paper ID",
        });
      }

      const paper = await QuestionPaper.findById(req.params.id);

      if (!paper) {
        return res.status(404).json({
          success: false,
          message: "Question paper not found",
        });
      }

      const validation = validatePaperFields(req.body);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      if (req.file && !isValidPdf(req.file)) {
        return res.status(400).json({
          success: false,
          message: "Invalid PDF file content",
        });
      }

      if (!req.file && !paper.pdfPublicId && !paper.pdfUrl) {
        return res.status(400).json({
          success: false,
          message: "Please upload a PDF file",
        });
      }

      if (req.file) {
        uploadedPdf = await uploadPdfToCloudinary(req.file);
      }

      const oldPdf = {
        publicId: paper.pdfPublicId,
        resourceType: paper.pdfResourceType || "image",
        deliveryType: paper.pdfDeliveryType || "upload",
      };

      paper.title = validation.title;
      paper.classNo = validation.classNo;
      paper.subject = validation.subject;
      paper.year = validation.year;
      paper.paperType = validation.paperType;
      paper.accessType = validation.accessType;
      paper.description = validation.description;
      paper.isPublished = parseBoolean(
        req.body.isPublished,
        paper.isPublished
      );

      if (uploadedPdf) {
        paper.pdfUrl = uploadedPdf.secure_url || "";
        paper.pdfName = getOriginalFileName(req.file);
        paper.pdfPublicId = uploadedPdf.public_id;
        paper.pdfResourceType = PDF_RESOURCE_TYPE;
        paper.pdfDeliveryType = PDF_DELIVERY_TYPE;
      }

      await paper.save();

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

      return res.json({
        success: true,
        message: "Question paper updated successfully",
        data: makeAdminPaper(paper.toObject()),
      });
    } catch (error) {
      console.error("Update question paper error:", error);

      if (uploadedPdf?.public_id) {
        try {
          await deleteCloudinaryPdf(uploadedPdf.public_id);
        } catch (deleteError) {
          console.error("New PDF cleanup error:", deleteError);
        }
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update question paper",
      });
    }
  });
});

// ==========================================
// ADMIN: DELETE QUESTION PAPER
// ==========================================

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid paper ID",
      });
    }

    const paper = await QuestionPaper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: "Question paper not found",
      });
    }

    if (paper.pdfPublicId) {
      try {
        await deleteCloudinaryPdf(
          paper.pdfPublicId,
          paper.pdfResourceType || "image",
          paper.pdfDeliveryType || "upload"
        );
      } catch (deleteError) {
        console.error("Cloudinary PDF deletion error:", deleteError);

        return res.status(500).json({
          success: false,
          message: "PDF could not be deleted from Cloudinary",
        });
      }
    }

    await paper.deleteOne();

    return res.json({
      success: true,
      message: "Question paper deleted successfully",
    });
  } catch (error) {
    console.error("Delete question paper error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete question paper",
    });
  }
});

export default router;
