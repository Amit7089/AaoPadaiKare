
import express from "express";
import mongoose from "mongoose";

import Quiz from "../models/Quiz.js";
import QuizResult from "../models/QuizResult.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Student from "../models/Student.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// ============================================
// Helpers
// ============================================

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const round = (value) => Number((Number(value) || 0).toFixed(2));

// ============================================
// GET: Student directory with quiz performance
// GET /api/admin/analytics/students
// Query: search, classNo, page, limit
// ============================================

router.get("/students", adminAuth, async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const classNo = String(req.query.classNo || "").trim();

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const studentFilter = {};

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");

      studentFilter.$or = [
        { name: regex },
        { email: regex },
      ];
    }

    if (classNo) {
      const parsedClass = Number(classNo);

      if (!Number.isInteger(parsedClass) || parsedClass < 6 || parsedClass > 12) {
        return res.status(400).json({
          success: false,
          message: "Invalid class filter.",
        });
      }

      studentFilter.classNo = parsedClass;
    }

    const [totalStudents, students] = await Promise.all([
      Student.countDocuments(studentFilter),

      Student.find(studentFilter)
        .select("name email classNo createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const studentIds = students.map((student) => student._id);

    const performance = studentIds.length
      ? await QuizResult.aggregate([
          {
            $match: {
              student: { $in: studentIds },
            },
          },
          {
            $group: {
              _id: "$student",
              totalAttempts: { $sum: 1 },
              averagePercentage: { $avg: "$percentage" },
              bestPercentage: { $max: "$percentage" },
              passedAttempts: {
                $sum: {
                  $cond: [{ $eq: ["$isPassed", true] }, 1, 0],
                },
              },
              failedAttempts: {
                $sum: {
                  $cond: [{ $eq: ["$isPassed", false] }, 1, 0],
                },
              },
            },
          },
        ])
      : [];

    const performanceMap = new Map(
      performance.map((item) => [String(item._id), item])
    );

    const studentList = students.map((student) => {
      const stats = performanceMap.get(String(student._id));

      const totalAttempts = stats?.totalAttempts || 0;
      const passedAttempts = stats?.passedAttempts || 0;

      return {
        ...student,
        totalAttempts,
        averagePercentage: round(stats?.averagePercentage),
        bestPercentage: round(stats?.bestPercentage),
        passedAttempts,
        failedAttempts: stats?.failedAttempts || 0,
        passPercentage:
          totalAttempts > 0
            ? round((passedAttempts / totalAttempts) * 100)
            : 0,
      };
    });

    return res.status(200).json({
      success: true,
      students: studentList,
      pagination: {
        page,
        limit,
        totalStudents,
        totalPages: Math.ceil(totalStudents / limit),
        hasNextPage: page * limit < totalStudents,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("ANALYTICS STUDENT LIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load students.",
    });
  }
});

// ============================================
// GET: Individual student detailed report
// GET /api/admin/analytics/students/:studentId
// ============================================

router.get("/students/:studentId", adminAuth, async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    const student = await Student.findById(studentId)
      .select("name email classNo createdAt")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const results = await QuizResult.find({ student: studentId })
      .sort({ submittedAt: -1 })
      .populate("quiz", "title subject chapter classNo totalMarks passingMarks")
      .lean();

    const totalAttempts = results.length;
    const passedAttempts = results.filter((item) => item.isPassed).length;
    const failedAttempts = totalAttempts - passedAttempts;

    const totalObtainedMarks = results.reduce(
      (sum, item) => sum + (Number(item.obtainedMarks) || 0),
      0
    );

    const totalMaximumMarks = results.reduce(
      (sum, item) => sum + (Number(item.totalMarks) || 0),
      0
    );

    const averagePercentage =
      totalAttempts > 0
        ? round(
            results.reduce(
              (sum, item) => sum + (Number(item.percentage) || 0),
              0
            ) / totalAttempts
          )
        : 0;

    const bestPercentage =
      totalAttempts > 0
        ? round(
            Math.max(...results.map((item) => Number(item.percentage) || 0))
          )
        : 0;

    const summary = {
      totalAttempts,
      passedAttempts,
      failedAttempts,
      averagePercentage,
      bestPercentage,
      totalObtainedMarks: round(totalObtainedMarks),
      totalMaximumMarks: round(totalMaximumMarks),
      passPercentage:
        totalAttempts > 0
          ? round((passedAttempts / totalAttempts) * 100)
          : 0,
      failPercentage:
        totalAttempts > 0
          ? round((failedAttempts / totalAttempts) * 100)
          : 0,
    };

    // ============================================
    // Subject-wise performance
    // ============================================

    const subjectMap = new Map();

    // ============================================
    // Chapter-wise performance
    // ============================================

    const chapterMap = new Map();

    results.forEach((result) => {
      if (!result.quiz) return;

      const subject = result.quiz.subject || "Other";
      const chapter = result.quiz.chapter || "Other";

      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, {
          subject,
          totalAttempts: 0,
          totalPercentage: 0,
          passed: 0,
          failed: 0,
        });
      }

      const subjectItem = subjectMap.get(subject);

      subjectItem.totalAttempts += 1;
      subjectItem.totalPercentage += Number(result.percentage) || 0;

      if (result.isPassed) {
        subjectItem.passed += 1;
      } else {
        subjectItem.failed += 1;
      }

      const chapterKey = `${subject}|||${chapter}`;

      if (!chapterMap.has(chapterKey)) {
        chapterMap.set(chapterKey, {
          subject,
          chapter,
          totalAttempts: 0,
          totalPercentage: 0,
          passed: 0,
          failed: 0,
        });
      }

      const chapterItem = chapterMap.get(chapterKey);

      chapterItem.totalAttempts += 1;
      chapterItem.totalPercentage += Number(result.percentage) || 0;

      if (result.isPassed) {
        chapterItem.passed += 1;
      } else {
        chapterItem.failed += 1;
      }
    });

    const subjectPerformance = Array.from(subjectMap.values())
      .map((item) => ({
        subject: item.subject,
        totalAttempts: item.totalAttempts,
        averagePercentage: round(
          item.totalPercentage / item.totalAttempts
        ),
        passed: item.passed,
        failed: item.failed,
      }))
      .sort((a, b) => b.averagePercentage - a.averagePercentage);

    const chapterPerformance = Array.from(chapterMap.values())
      .map((item) => ({
        subject: item.subject,
        chapter: item.chapter,
        totalAttempts: item.totalAttempts,
        averagePercentage: round(
          item.totalPercentage / item.totalAttempts
        ),
        passed: item.passed,
        failed: item.failed,
      }))
      .sort((a, b) => a.averagePercentage - b.averagePercentage);

    // ============================================
    // Quiz history
    // ============================================

    const quizHistory = results.map((result) => ({
      _id: result._id,
      quiz: result.quiz
        ? {
            _id: result.quiz._id,
            title: result.quiz.title,
            subject: result.quiz.subject,
            chapter: result.quiz.chapter,
            classNo: result.quiz.classNo,
            passingMarks: result.quiz.passingMarks,
          }
        : null,
      totalQuestions: result.totalQuestions,
      attemptedQuestions: result.attemptedQuestions,
      correctAnswers: result.correctAnswers,
      wrongAnswers: result.wrongAnswers,
      totalMarks: result.totalMarks,
      obtainedMarks: result.obtainedMarks,
      percentage: round(result.percentage),
      isPassed: result.isPassed,
      startedAt: result.startedAt,
      submittedAt: result.submittedAt,
    }));

    return res.status(200).json({
      success: true,
      student,
      summary,
      subjectPerformance,
      chapterPerformance,
      quizHistory,
    });
  } catch (error) {
    console.error("INDIVIDUAL STUDENT ANALYTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load student report.",
    });
  }
});

// ============================================
// GET: Main Admin Analytics Dashboard
// GET /api/admin/analytics
// ============================================

router.get("/", adminAuth, async (req, res) => {
  try {
    const [
      totalStudents,
      totalQuizzes,
      publishedQuizzes,
      totalAttempts,
      activeAttempts,
      passCount,
      failCount,
      averageResult,
    ] = await Promise.all([
      Student.countDocuments(),
      Quiz.countDocuments(),
      Quiz.countDocuments({ isPublished: true }),
      QuizResult.countDocuments(),
      QuizAttempt.countDocuments({ status: "in-progress" }),
      QuizResult.countDocuments({ isPassed: true }),
      QuizResult.countDocuments({ isPassed: false }),
      QuizResult.aggregate([
        {
          $group: {
            _id: null,
            averagePercentage: { $avg: "$percentage" },
            averageObtainedMarks: { $avg: "$obtainedMarks" },
          },
        },
      ]),
    ]);

    const draftQuizzes = totalQuizzes - publishedQuizzes;

    const averagePercentage = round(
      averageResult[0]?.averagePercentage
    );

    const averageObtainedMarks = round(
      averageResult[0]?.averageObtainedMarks
    );

    const passPercentage =
      totalAttempts > 0
        ? round((passCount / totalAttempts) * 100)
        : 0;

    const failPercentage =
      totalAttempts > 0
        ? round((failCount / totalAttempts) * 100)
        : 0;

    // Class-wise performance
    const classPerformance = await QuizResult.aggregate([
      {
        $lookup: {
          from: Quiz.collection.name,
          localField: "quiz",
          foreignField: "_id",
          as: "quizInfo",
        },
      },
      { $unwind: "$quizInfo" },
      {
        $group: {
          _id: "$quizInfo.classNo",
          totalAttempts: { $sum: 1 },
          averagePercentage: { $avg: "$percentage" },
          passed: {
            $sum: {
              $cond: ["$isPassed", 1, 0],
            },
          },
          failed: {
            $sum: {
              $cond: ["$isPassed", 0, 1],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          classNo: "$_id",
          totalAttempts: 1,
          averagePercentage: { $round: ["$averagePercentage", 2] },
          passed: 1,
          failed: 1,
        },
      },
      { $sort: { classNo: 1 } },
    ]);

    // Subject-wise performance
    const subjectPerformance = await QuizResult.aggregate([
      {
        $lookup: {
          from: Quiz.collection.name,
          localField: "quiz",
          foreignField: "_id",
          as: "quizInfo",
        },
      },
      { $unwind: "$quizInfo" },
      {
        $group: {
          _id: "$quizInfo.subject",
          totalAttempts: { $sum: 1 },
          averagePercentage: { $avg: "$percentage" },
          passed: {
            $sum: {
              $cond: ["$isPassed", 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          subject: "$_id",
          totalAttempts: 1,
          averagePercentage: { $round: ["$averagePercentage", 2] },
          passed: 1,
        },
      },
      { $sort: { averagePercentage: -1 } },
    ]);

    // Top 5 students
    const topStudents = await QuizResult.aggregate([
      {
        $group: {
          _id: "$student",
          totalAttempts: { $sum: 1 },
          averagePercentage: { $avg: "$percentage" },
          bestPercentage: { $max: "$percentage" },
          passedAttempts: {
            $sum: {
              $cond: ["$isPassed", 1, 0],
            },
          },
        },
      },
      { $sort: { averagePercentage: -1, totalAttempts: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: Student.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "studentInfo",
        },
      },
      { $unwind: "$studentInfo" },
      {
        $project: {
          _id: 0,
          studentId: "$studentInfo._id",
          name: "$studentInfo.name",
          email: "$studentInfo.email",
          classNo: "$studentInfo.classNo",
          totalAttempts: 1,
          averagePercentage: { $round: ["$averagePercentage", 2] },
          bestPercentage: { $round: ["$bestPercentage", 2] },
          passedAttempts: 1,
        },
      },
    ]);

    // Recent quiz attempts
    const recentAttempts = await QuizResult.find()
      .sort({ submittedAt: -1 })
      .limit(10)
      .populate("student", "name email classNo")
      .populate("quiz", "title subject chapter classNo")
      .lean();

    // Last 7 days registration trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const registrations = await Student.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const registrationMap = new Map(
      registrations.map((item) => [item._id, item.count])
    );

    const registrationTrend = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + i);

      const dateKey = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      registrationTrend.push({
        date: dateKey,
        registrations: registrationMap.get(dateKey) || 0,
      });
    }

    return res.status(200).json({
      success: true,
      analytics: {
        overview: {
          totalStudents,
          totalQuizzes,
          publishedQuizzes,
          draftQuizzes,
          totalAttempts,
          activeAttempts,
          averagePercentage,
          averageObtainedMarks,
          passCount,
          failCount,
          passPercentage,
          failPercentage,
        },
        classPerformance,
        subjectPerformance,
        topStudents,
        recentAttempts,
        registrationTrend,
      },
    });
  } catch (error) {
    console.error("ADMIN ANALYTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load analytics dashboard.",
    });
  }
});

export default router;
