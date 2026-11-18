
import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    startedAt: {
      type: Date,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["in-progress", "submitted", "expired"],
      default: "in-progress",
      index: true,
    },

    result: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuizResult",
      default: null,
    },
  },
  { timestamps: true }
);

// Student ke quiz attempts ko jaldi find karne ke liye
quizAttemptSchema.index({
  student: 1,
  quiz: 1,
  startedAt: -1,
});

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);

export default QuizAttempt;
