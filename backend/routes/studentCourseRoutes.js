
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import Course from "../models/Course.js";
import CourseSubject from "../models/CourseSubject.js";
import CourseLesson from "../models/CourseLesson.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

const PDF_URL_VALIDITY_SECONDS = 10 * 60;

const isValidId = (id) => mongoose.isValidObjectId(id);

// ==========================================
// OPTIONAL STUDENT AUTHENTICATION
// ==========================================

const getStudentId = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.split(" ")[1];

    if (!token || !process.env.JWT_SECRET) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "student" || !decoded.id) {
      return null;
    }

    return decoded.id;
  } catch {
    return null;
  }
};

// ==========================================
// CHECK ACTIVE COURSE ENROLLMENT
// ==========================================

const hasActiveEnrollment = async (studentId, courseId) => {
  if (!studentId) return false;

  const now = new Date();

  const enrollment = await CourseEnrollment.findOne({
    student: studentId,
    course: courseId,
    status: "active",
    startsAt: { $lte: now },
    expiresAt: { $gt: now },
  })
    .select("_id")
    .lean();

  return Boolean(enrollment);
};

// ==========================================
// SECURE PDF URL
// ==========================================

const generatePdfUrl = (lesson) => {
  if (
    !lesson?.pdfPublicId ||
    lesson.pdfDeliveryType !== "authenticated"
  ) {
    return null;
  }

  const expiresAt =
    Math.floor(Date.now() / 1000) + PDF_URL_VALIDITY_SECONDS;

  return cloudinary.utils.private_download_url(
    lesson.pdfPublicId,
    "pdf",
    {
      resource_type: lesson.pdfResourceType || "image",
      type: "authenticated",
      expires_at: expiresAt,
      attachment: false,
    }
  );
};

// ==========================================
// SAFE LESSON RESPONSE
// ==========================================

const makeLessonSummary = (lesson, hasAccess) => ({
  _id: lesson._id,
  title: lesson.title,
  chapter: lesson.chapter,
  language: lesson.language,
  accessType: lesson.accessType,
  displayOrder: lesson.displayOrder,
  isLocked: lesson.accessType === "premium" && !hasAccess,
  hasPdf: Boolean(lesson.pdfPublicId || lesson.pdfUrl),
  hasVideo: Boolean(lesson.videoUrl),
});

// ==========================================
// GET ALL PUBLISHED COURSES
// ==========================================

router.get("/", async (req, res) => {
  try {
    const filter = {
      isPublished: true,
    };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.classNo) {
      const classNo = Number(req.query.classNo);

      if (!Number.isInteger(classNo) || classNo < 1 || classNo > 12) {
        return res.status(400).json({
          success: false,
          message: "Invalid target class",
        });
      }

      filter.targetClasses = classNo;
    }

    const courses = await Course.find(filter)
      .select(
        "title slug examCode category targetClasses shortDescription supportedLanguages thumbnailUrl price compareAtPrice durationDays featured displayOrder"
      )
      .sort({ featured: -1, displayOrder: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error("Student get courses error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load courses",
    });
  }
});

// ==========================================
// GET COURSE DETAILS
// ==========================================

router.get("/:slug", async (req, res) => {
  try {
    const course = await Course.findOne({
      slug: req.params.slug,
      isPublished: true,
    }).lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const studentId = getStudentId(req);

    const hasAccess = await hasActiveEnrollment(
      studentId,
      course._id
    );

    const language = req.query.language || "Hindi";

    if (!course.supportedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: "This language is not available for this course",
      });
    }

    const subjects = await CourseSubject.find({
      course: course._id,
      isPublished: true,
    })
      .sort({ displayOrder: 1 })
      .lean();

    const subjectIds = subjects.map((subject) => subject._id);

    const lessons = await CourseLesson.find({
      course: course._id,
      subject: { $in: subjectIds },
      language,
      isPublished: true,
    })
      .select(
        "title chapter subject language accessType displayOrder pdfPublicId pdfUrl videoUrl"
      )
      .sort({ displayOrder: 1 })
      .lean();

    const subjectData = subjects.map((subject) => ({
      _id: subject._id,
      name: subject.name,
      description: subject.description,
      displayOrder: subject.displayOrder,
      lessons: lessons
        .filter(
          (lesson) =>
            String(lesson.subject) === String(subject._id)
        )
        .map((lesson) =>
          makeLessonSummary(lesson, hasAccess)
        ),
    }));

    return res.json({
      success: true,
      course: {
        ...course,
        subjects: subjectData,
      },
      loggedIn: Boolean(studentId),
      hasAccess,
      selectedLanguage: language,
    });
  } catch (error) {
    console.error("Student course details error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load course details",
    });
  }
});

// ==========================================
// GET SINGLE LESSON
// ==========================================

router.get("/:courseId/lessons/:lessonId", async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    if (!isValidId(courseId) || !isValidId(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course or lesson ID",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      isPublished: true,
    }).select("_id title slug");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const lesson = await CourseLesson.findOne({
      _id: lessonId,
      course: courseId,
      isPublished: true,
    }).lean();

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const studentId = getStudentId(req);

    let hasAccess = lesson.accessType === "demo";

    if (!hasAccess && studentId) {
      hasAccess = await hasActiveEnrollment(
        studentId,
        courseId
      );
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        locked: true,
        requiresLogin: !studentId,
        requiresPremium: Boolean(studentId),
        courseId,
        courseSlug: course.slug,
        message: studentId
          ? "Purchase this course to access this lesson"
          : "Please login to access this lesson",
      });
    }

    const pdfUrl = lesson.pdfPublicId
      ? generatePdfUrl(lesson)
      : "";

    if (lesson.pdfPublicId && !pdfUrl) {
      return res.status(409).json({
        success: false,
        message: "This PDF needs to be re-uploaded securely",
      });
    }

    const {
      pdfPublicId,
      pdfResourceType,
      pdfDeliveryType,
      pdfUrl: storedPdfUrl,
      ...safeLesson
    } = lesson;

    return res.json({
      success: true,
      course: {
        _id: course._id,
        title: course.title,
        slug: course.slug,
      },
      lesson: {
        ...safeLesson,
        pdfUrl,
        hasPdf: Boolean(pdfPublicId || storedPdfUrl),
        isLocked: false,
      },
    });
  } catch (error) {
    console.error("Student get lesson error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load lesson",
    });
  }
});

export default router;
