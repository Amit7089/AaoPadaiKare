
import express from "express";
import mongoose from "mongoose";

import cloudinary from "../config/cloudinary.js";
import Course from "../models/Course.js";
import CourseSubject from "../models/CourseSubject.js";
import CourseLesson from "../models/CourseLesson.js";
import upload from "../middleware/upload.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.use(adminAuth);

const PDF_RESOURCE_TYPE = "image";
const PDF_DELIVERY_TYPE = "authenticated";
const PDF_URL_VALIDITY_SECONDS = 10 * 60;

const isValidId = (id) => mongoose.isValidObjectId(id);

const isValidPdf = (file) => {
  if (!file?.buffer || file.buffer.length < 5) return false;
  return file.buffer.subarray(0, 5).toString() === "%PDF-";
};

const isValidYouTubeUrl = (url) => {
  if (!url) return true;

  try {
    const parsed = new URL(url);

    return (
      ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"].includes(
        parsed.hostname.toLowerCase()
      ) &&
      ["https:", "http:"].includes(parsed.protocol)
    );
  } catch {
    return false;
  }
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") return value;

  if (value === "true") return true;
  if (value === "false") return false;

  return null;
};

const uploadPdfToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    if (!isValidPdf(file)) {
      return reject(new Error("Invalid PDF file"));
    }

    const uniqueName = `course-lesson-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "aao-padai-kare/course-lessons",
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

const deleteCloudinaryPdf = async (publicId) => {
  if (!publicId) return;

  return cloudinary.uploader.destroy(publicId, {
    resource_type: PDF_RESOURCE_TYPE,
    type: PDF_DELIVERY_TYPE,
    invalidate: true,
  });
};

const generatePdfUrl = (lesson) => {
  if (
    !lesson?.pdfPublicId ||
    lesson.pdfDeliveryType !== PDF_DELIVERY_TYPE
  ) {
    return null;
  }

  const expiresAt =
    Math.floor(Date.now() / 1000) + PDF_URL_VALIDITY_SECONDS;

  return cloudinary.utils.private_download_url(
    lesson.pdfPublicId,
    "pdf",
    {
      resource_type: PDF_RESOURCE_TYPE,
      type: PDF_DELIVERY_TYPE,
      expires_at: expiresAt,
      attachment: false,
    }
  );
};

const makeAdminLesson = (lesson) => {
  const {
    pdfUrl,
    pdfPublicId,
    pdfResourceType,
    pdfDeliveryType,
    ...safeLesson
  } = lesson;

  return {
    ...safeLesson,
    pdfUrl: "",
    hasPdf: Boolean(pdfPublicId || pdfUrl),
  };
};

const getCourseAndSubject = async (courseId, subjectId) => {
  const [course, subject] = await Promise.all([
    Course.findById(courseId).select("_id supportedLanguages"),
    CourseSubject.findOne({
      _id: subjectId,
      course: courseId,
    }).select("_id course"),
  ]);

  return { course, subject };
};

// ==========================================
// GET ALL LESSONS OF A SUBJECT
// ==========================================

router.get(
  "/:courseId/subjects/:subjectId/lessons",
  async (req, res) => {
    try {
      const { courseId, subjectId } = req.params;

      if (!isValidId(courseId) || !isValidId(subjectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course or subject ID",
        });
      }

      const { course, subject } = await getCourseAndSubject(
        courseId,
        subjectId
      );

      if (!course || !subject) {
        return res.status(404).json({
          success: false,
          message: "Course or subject not found",
        });
      }

      const lessons = await CourseLesson.find({
        course: courseId,
        subject: subjectId,
      })
        .sort({ displayOrder: 1, createdAt: 1 })
        .lean();

      return res.json({
        success: true,
        count: lessons.length,
        lessons: lessons.map(makeAdminLesson),
      });
    } catch (error) {
      console.error("Admin get lessons error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not fetch lessons",
      });
    }
  }
);

// ==========================================
// GET SINGLE LESSON
// ==========================================

router.get("/lessons/:lessonId", async (req, res) => {
  try {
    const { lessonId } = req.params;

    if (!isValidId(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const lesson = await CourseLesson.findById(lessonId).lean();

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    let pdfUrl = "";

    if (lesson.pdfPublicId) {
      pdfUrl = generatePdfUrl(lesson);

      if (!pdfUrl) {
        return res.status(409).json({
          success: false,
          message: "This PDF needs to be re-uploaded securely.",
          pdfMigrationRequired: true,
        });
      }
    }

    return res.json({
      success: true,
      lesson: {
        ...makeAdminLesson(lesson),
        pdfUrl,
      },
    });
  } catch (error) {
    console.error("Admin get single lesson error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not fetch lesson",
    });
  }
});

// ==========================================
// CREATE LESSON
// ==========================================

router.post(
  "/:courseId/subjects/:subjectId/lessons",
  (req, res) => {
    upload.single("pdf")(req, res, async (uploadError) => {
      if (uploadError) {
        return res.status(400).json({
          success: false,
          message: uploadError.message,
        });
      }

      let uploadedPdf = null;

      try {
        const { courseId, subjectId } = req.params;

        if (!isValidId(courseId) || !isValidId(subjectId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid course or subject ID",
          });
        }

        const {
          title,
          chapter = "",
          language = "Hindi",
          content = "",
          videoUrl = "",
          accessType = "premium",
          displayOrder = 0,
        } = req.body;

        const isPublished = parseBoolean(
          req.body.isPublished,
          false
        );

        if (!title?.trim()) {
          return res.status(400).json({
            success: false,
            message: "Lesson title is required",
          });
        }

        if (!["Hindi", "English"].includes(language)) {
          return res.status(400).json({
            success: false,
            message: "Invalid lesson language",
          });
        }

        if (!["demo", "premium"].includes(accessType)) {
          return res.status(400).json({
            success: false,
            message: "Invalid lesson access type",
          });
        }

        if (isPublished === null) {
          return res.status(400).json({
            success: false,
            message: "Invalid publish status",
          });
        }

        if (!isValidYouTubeUrl(videoUrl.trim())) {
          return res.status(400).json({
            success: false,
            message: "Please enter a valid YouTube URL",
          });
        }

        if (!content.trim() && !videoUrl.trim() && !req.file) {
          return res.status(400).json({
            success: false,
            message: "Provide lesson content, a YouTube video or a PDF",
          });
        }

        const { course, subject } = await getCourseAndSubject(
          courseId,
          subjectId
        );

        if (!course || !subject) {
          return res.status(404).json({
            success: false,
            message: "Course or subject not found",
          });
        }

        if (!course.supportedLanguages.includes(language)) {
          return res.status(400).json({
            success: false,
            message: "This language is not enabled for the course",
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

        const lesson = await CourseLesson.create({
          course: courseId,
          subject: subjectId,
          title: title.trim(),
          chapter: chapter.trim(),
          language,
          content,
          videoUrl: videoUrl.trim(),
          pdfUrl: uploadedPdf?.secure_url || "",
          pdfName: req.file?.originalname || "",
          pdfPublicId: uploadedPdf?.public_id || "",
          pdfResourceType: uploadedPdf
            ? PDF_RESOURCE_TYPE
            : "raw",
          pdfDeliveryType: PDF_DELIVERY_TYPE,
          accessType,
          displayOrder: Number(displayOrder) || 0,
          isPublished,
        });

        return res.status(201).json({
          success: true,
          message: "Lesson created successfully",
          lesson: makeAdminLesson(lesson.toObject()),
        });
      } catch (error) {
        console.error("Create course lesson error:", error);

        if (uploadedPdf?.public_id) {
          try {
            await deleteCloudinaryPdf(uploadedPdf.public_id);
          } catch (deleteError) {
            console.error("PDF cleanup error:", deleteError);
          }
        }

        return res.status(400).json({
          success: false,
          message: error.message || "Could not create lesson",
        });
      }
    });
  }
);

// ==========================================
// UPDATE LESSON
// ==========================================

router.put("/lessons/:lessonId", (req, res) => {
  upload.single("pdf")(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        message: uploadError.message,
      });
    }

    let uploadedPdf = null;

    try {
      const { lessonId } = req.params;

      if (!isValidId(lessonId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lesson ID",
        });
      }

      const lesson = await CourseLesson.findById(lessonId);

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: "Lesson not found",
        });
      }

      const {
        title,
        chapter,
        language,
        content,
        videoUrl,
        accessType,
        displayOrder,
      } = req.body;

      const isPublished = parseBoolean(
        req.body.isPublished,
        lesson.isPublished
      );

      const nextLanguage = language ?? lesson.language;
      const nextAccessType = accessType ?? lesson.accessType;
      const nextVideoUrl = videoUrl ?? lesson.videoUrl;

      if (title !== undefined && !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Lesson title cannot be empty",
        });
      }

      if (!["Hindi", "English"].includes(nextLanguage)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lesson language",
        });
      }

      if (!["demo", "premium"].includes(nextAccessType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lesson access type",
        });
      }

      if (!isValidYouTubeUrl(nextVideoUrl.trim())) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid YouTube URL",
        });
      }

      if (isPublished === null) {
        return res.status(400).json({
          success: false,
          message: "Invalid publish status",
        });
      }

      const course = await Course.findById(lesson.course)
        .select("supportedLanguages");

      if (
        !course ||
        !course.supportedLanguages.includes(nextLanguage)
      ) {
        return res.status(400).json({
          success: false,
          message: "This language is not enabled for the course",
        });
      }

      const nextContent =
        content !== undefined ? content : lesson.content;

      if (
        !nextContent.trim() &&
        !nextVideoUrl.trim() &&
        !req.file &&
        !lesson.pdfPublicId &&
        !lesson.pdfUrl
      ) {
        return res.status(400).json({
          success: false,
          message: "Lesson must contain text, video or PDF content",
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

      const oldPdfPublicId = lesson.pdfPublicId;

      if (title !== undefined) lesson.title = title.trim();
      if (chapter !== undefined) lesson.chapter = chapter.trim();

      lesson.language = nextLanguage;
      lesson.content = nextContent;
      lesson.videoUrl = nextVideoUrl.trim();
      lesson.accessType = nextAccessType;
      lesson.isPublished = isPublished;

      if (displayOrder !== undefined) {
        const order = Number(displayOrder);

        if (!Number.isFinite(order)) {
          throw new Error("Invalid display order");
        }

        lesson.displayOrder = order;
      }

      if (uploadedPdf) {
        lesson.pdfUrl = uploadedPdf.secure_url;
        lesson.pdfName = req.file.originalname || "";
        lesson.pdfPublicId = uploadedPdf.public_id;
        lesson.pdfResourceType = PDF_RESOURCE_TYPE;
        lesson.pdfDeliveryType = PDF_DELIVERY_TYPE;
      }

      await lesson.save();

      if (uploadedPdf && oldPdfPublicId) {
        try {
          await deleteCloudinaryPdf(oldPdfPublicId);
        } catch (deleteError) {
          console.error("Old PDF deletion error:", deleteError);
        }
      }

      return res.json({
        success: true,
        message: "Lesson updated successfully",
        lesson: makeAdminLesson(lesson.toObject()),
      });
    } catch (error) {
      console.error("Update course lesson error:", error);

      if (uploadedPdf?.public_id) {
        try {
          await deleteCloudinaryPdf(uploadedPdf.public_id);
        } catch (deleteError) {
          console.error("New PDF cleanup error:", deleteError);
        }
      }

      return res.status(400).json({
        success: false,
        message: error.message || "Could not update lesson",
      });
    }
  });
});

// ==========================================
// DELETE LESSON
// ==========================================

router.delete("/lessons/:lessonId", async (req, res) => {
  try {
    const { lessonId } = req.params;

    if (!isValidId(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const lesson = await CourseLesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    if (lesson.pdfPublicId) {
      try {
        await deleteCloudinaryPdf(lesson.pdfPublicId);
      } catch (error) {
        console.error("Cloudinary PDF deletion error:", error);

        return res.status(500).json({
          success: false,
          message: "PDF could not be deleted from Cloudinary",
        });
      }
    }

    await lesson.deleteOne();

    return res.json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    console.error("Delete course lesson error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not delete lesson",
    });
  }
});

export default router;
