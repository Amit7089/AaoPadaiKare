
import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    selectedOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },

    isCorrect: {
      type: Boolean,
      required: true,
    },

    marksObtained: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const quizResultSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    answers: {
      type: [answerSchema],
      default: [],
    },

    totalQuestions: {
      type: Number,
      required: true,
      min: 0,
    },

    attemptedQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    correctAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },

    wrongAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    obtainedMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    isPassed: {
      type: Boolean,
      default: false,
    },

    startedAt: {
      type: Date,
      required: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

quizResultSchema.index({ student: 1, quiz: 1, submittedAt: -1 });

const QuizResult = mongoose.model("QuizResult", quizResultSchema);

export default QuizResult;
