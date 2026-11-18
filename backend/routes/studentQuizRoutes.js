
import express from "express";
import mongoose from "mongoose";

import Quiz from "../models/Quiz.js";
import QuizResult from "../models/QuizResult.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Student from "../models/Student.js";
import studentAuth from "../middleware/studentAuth.js";

const router = express.Router();

// ============================================
// Helper: Safe quiz questions
// Never expose correct answers before submission
// ============================================
const getSafeQuiz = (quiz) => {
  const safeQuestions = (quiz.questions || []).map((question) => ({
    _id: question._id,
    questionText: question.questionText,
    options: question.options,
    marks: question.marks,
  }));

  return {
    _id: quiz._id,
    title: quiz.title,
    description: quiz.description,
    classNo: quiz.classNo,
    subject: quiz.subject,
    chapter: quiz.chapter,
    durationMinutes: quiz.durationMinutes,
    totalMarks: quiz.totalMarks,
    passingMarks: quiz.passingMarks,
    questions: safeQuestions,
  };
};

// ============================================
// GET: Published quizzes for student's class
// ============================================
router.get("/quizzes", studentAuth, async (req, res) => {
  try {
    const student = await Student.findById(req.studentId)
      .select("classNo");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const quizzes = await Quiz.find({
      classNo: student.classNo,
      isPublished: true,
    })
      .select(
        "title description classNo subject chapter durationMinutes totalMarks passingMarks createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      quizzes,
    });
  } catch (error) {
    console.error("FETCH STUDENT QUIZZES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quizzes.",
    });
  }
});

// ============================================
// GET: Single quiz questions (safe preview)
// Does not start an attempt
// ============================================
router.get("/quizzes/:id", studentAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID.",
      });
    }

    const student = await Student.findById(req.studentId)
      .select("classNo");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const quiz = await Quiz.findOne({
      _id: id,
      classNo: student.classNo,
      isPublished: true,
    }).lean();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found.",
      });
    }

    return res.json({
      success: true,
      quiz: getSafeQuiz(quiz),
    });
  } catch (error) {
    console.error("LOAD STUDENT QUIZ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load quiz.",
    });
  }
});

// ============================================
// POST: Start a new quiz attempt
// Timer is created by backend server
// ============================================
router.post("/quizzes/:id/start", studentAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID.",
      });
    }

    const student = await Student.findById(req.studentId)
      .select("classNo");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const quiz = await Quiz.findOne({
      _id: id,
      classNo: student.classNo,
      isPublished: true,
    }).lean();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found.",
      });
    }

    const startedAt = new Date();

    const expiresAt = new Date(
      startedAt.getTime() + quiz.durationMinutes * 60 * 1000
    );

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      student: req.studentId,
      startedAt,
      expiresAt,
      status: "in-progress",
    });

    return res.status(201).json({
      success: true,
      message: "Quiz started successfully.",
      attempt: {
        _id: attempt._id,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        serverTime: new Date(),
        status: attempt.status,
      },
      quiz: getSafeQuiz(quiz),
    });
  } catch (error) {
    console.error("START QUIZ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start quiz.",
    });
  }
});

// ============================================
// POST: Submit quiz answers
// Backend checks attempt and expiration time
// Duplicate submission is blocked
// ============================================
router.post("/quizzes/:id/submit", studentAuth, async (req, res) => {
  let claimedAttemptId = null;

  try {
    const { id } = req.params;
    const { attemptId, answers } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID.",
      });
    }

    if (!mongoose.isValidObjectId(attemptId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz attempt ID.",
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Answers must be an array.",
      });
    }

    const student = await Student.findById(req.studentId)
      .select("classNo");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const quiz = await Quiz.findOne({
      _id: id,
      classNo: student.classNo,
      isPublished: true,
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found.",
      });
    }

    // Verify that this attempt belongs to this student and quiz
    const attempt = await QuizAttempt.findOne({
      _id: attemptId,
      quiz: quiz._id,
      student: req.studentId,
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Quiz attempt not found.",
      });
    }

    // Block already submitted attempts
    if (attempt.status === "submitted") {
      return res.status(409).json({
        success: false,
        message: "This quiz attempt has already been submitted.",
        resultId: attempt.result || null,
      });
    }

    if (attempt.status === "expired") {
      return res.status(410).json({
        success: false,
        message: "Quiz time has expired.",
      });
    }

    const now = new Date();

    // Server-side timer validation
    if (now >= attempt.expiresAt) {
      await QuizAttempt.updateOne(
        {
          _id: attempt._id,
          status: "in-progress",
        },
        {
          $set: {
            status: "expired",
          },
        }
      );

      return res.status(410).json({
        success: false,
        message: "Quiz time has expired. Submission is not allowed.",
      });
    }

    // Validate all submitted answers before claiming the attempt
    const questionMap = new Map(
      quiz.questions.map((question) => [
        question._id.toString(),
        question,
      ])
    );

    const seenQuestions = new Set();
    const evaluatedAnswers = [];

    let correctAnswers = 0;
    let wrongAnswers = 0;
    let obtainedMarks = 0;

    for (const answer of answers) {
      const questionId = String(answer?.questionId || "");

      if (
        !mongoose.isValidObjectId(questionId) ||
        !questionMap.has(questionId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid question submitted.",
        });
      }

      if (seenQuestions.has(questionId)) {
        return res.status(400).json({
          success: false,
          message: "Duplicate question answer submitted.",
        });
      }

      seenQuestions.add(questionId);

      const selectedIndex = answer.selectedOptionIndex;

      if (
        !Number.isInteger(selectedIndex) ||
        selectedIndex < 0 ||
        selectedIndex > 3
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid selected option.",
        });
      }

      const question = questionMap.get(questionId);

      const isCorrect =
        selectedIndex === question.correctAnswerIndex;

      const marksObtained = isCorrect ? question.marks : 0;

      if (isCorrect) {
        correctAnswers++;
        obtainedMarks += marksObtained;
      } else {
        wrongAnswers++;
      }

      evaluatedAnswers.push({
        questionId: question._id,
        selectedOptionIndex: selectedIndex,
        isCorrect,
        marksObtained,
      });
    }

    // Atomically claim the attempt.
    // Only one request can change in-progress to submitted.
    const claimedAttempt = await QuizAttempt.findOneAndUpdate(
      {
        _id: attempt._id,
        student: req.studentId,
        quiz: quiz._id,
        status: "in-progress",
        expiresAt: { $gt: now },
      },
      {
        $set: {
          status: "submitted",
          submittedAt: now,
        },
      },
      {
        new: true,
      }
    );

    if (!claimedAttempt) {
      const latestAttempt = await QuizAttempt.findById(attempt._id)
        .select("status result");

      if (latestAttempt?.status === "submitted") {
        return res.status(409).json({
          success: false,
          message: "This quiz attempt has already been submitted.",
          resultId: latestAttempt.result || null,
        });
      }

      return res.status(410).json({
        success: false,
        message: "Quiz attempt expired or is no longer active.",
      });
    }

    claimedAttemptId = claimedAttempt._id;

    const totalQuestions = quiz.questions.length;
    const attemptedQuestions = evaluatedAnswers.length;
    const totalMarks = quiz.totalMarks;

    const percentage =
      totalMarks > 0
        ? Number(
            ((obtainedMarks / totalMarks) * 100).toFixed(2)
          )
        : 0;

    const isPassed = obtainedMarks >= quiz.passingMarks;

    // Create result using server-generated attempt start time
    const result = await QuizResult.create({
      quiz: quiz._id,
      student: req.studentId,
      answers: evaluatedAnswers,
      totalQuestions,
      attemptedQuestions,
      correctAnswers,
      wrongAnswers,
      totalMarks,
      obtainedMarks,
      percentage,
      isPassed,
      startedAt: claimedAttempt.startedAt,
      submittedAt: now,
    });

    // Link result to attempt
    await QuizAttempt.updateOne(
      {
        _id: claimedAttempt._id,
        student: req.studentId,
      },
      {
        $set: {
          result: result._id,
        },
      }
    );

    console.log("QUIZ RESULT CALCULATION:", {
      quizId: quiz._id.toString(),
      attemptId: claimedAttempt._id.toString(),
      totalMarks,
      passingMarks: quiz.passingMarks,
      obtainedMarks,
      percentage,
      isPassed,
    });

    return res.status(201).json({
      success: true,
      message: "Quiz submitted successfully.",
      result: {
        _id: result._id,
        totalQuestions,
        attemptedQuestions,
        correctAnswers,
        wrongAnswers,
        totalMarks,
        obtainedMarks,
        percentage,
        isPassed,
      },
    });
  } catch (error) {
    console.error("SUBMIT QUIZ ERROR:", error);

    // If result creation failed, release the attempt for retry.
    // Never reset it if a result has already been created.
    if (claimedAttemptId) {
      try {
        const existingResult = await QuizResult.findOne({
          student: req.studentId,
          quiz: req.params.id,
          startedAt: {
            $exists: true,
          },
        }).select("_id");

        const currentAttempt = await QuizAttempt.findById(
          claimedAttemptId
        ).select("result");

        if (!currentAttempt?.result) {
          await QuizAttempt.updateOne(
            {
              _id: claimedAttemptId,
              status: "submitted",
              result: null,
            },
            {
              $set: {
                status: "in-progress",
                submittedAt: null,
              },
            }
          );
        }
      } catch (recoveryError) {
        console.error("QUIZ ATTEMPT RECOVERY ERROR:", recoveryError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to submit quiz. Please try again.",
    });
  }
});

// ============================================
// GET: All quiz results for logged-in student
// ============================================
router.get("/results", studentAuth, async (req, res) => {
  try {
    const results = await QuizResult.find({
      student: req.studentId,
    })
      .populate("quiz", "title subject chapter classNo")
      .sort({ submittedAt: -1 })
      .lean();

    return res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("FETCH QUIZ HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quiz history.",
    });
  }
});

// ============================================
// GET: Single detailed result using RESULT ID
// Correct answers visible only after submission
// ============================================
router.get("/results/:id", studentAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID.",
      });
    }

    const result = await QuizResult.findOne({
      _id: id,
      student: req.studentId,
    }).lean();

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Quiz result not found.",
      });
    }

    const quiz = await Quiz.findById(result.quiz)
      .select(
        "title subject chapter classNo questions._id questions.questionText questions.options questions.correctAnswerIndex questions.marks questions.explanation"
      )
      .lean();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz details not found.",
      });
    }

    const questionMap = new Map(
      (quiz.questions || [])
        .filter((question) => question._id)
        .map((question) => [
          question._id.toString(),
          question,
        ])
    );

    const detailedAnswers = (result.answers || []).map((answer) => {
      const questionId = answer.questionId?.toString() || "";
      const question = questionMap.get(questionId);

      return {
        ...answer,
        question: question
          ? {
              questionText: question.questionText,
              options: question.options || [],
              correctAnswerIndex: question.correctAnswerIndex,
              explanation: question.explanation || "",
              marks: question.marks || 0,
            }
          : null,
      };
    });

    return res.json({
      success: true,
      result: {
        ...result,
        answers: detailedAnswers,
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          subject: quiz.subject,
          chapter: quiz.chapter,
          classNo: quiz.classNo,
        },
      },
    });
  } catch (error) {
    console.error("DETAILED QUIZ RESULT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch detailed quiz result.",
    });
  }
});

export default router;
