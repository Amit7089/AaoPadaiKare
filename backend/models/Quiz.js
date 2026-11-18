
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options) =>
          options.length === 4 &&
          options.every((option) => option.trim().length > 0),
        message: "Each question must have exactly 4 non-empty options.",
      },
    },

    correctAnswerIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },

    marks: {
      type: Number,
      default: 1,
      min: 1,
    },

    explanation: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    classNo: {
      type: Number,
      required: true,
      min: 6,
      max: 12,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    chapter: {
      type: String,
      required: true,
      trim: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      default: 30,
    },

    passingMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    questions: {
      type: [questionSchema],
      validate: {
        validator: (questions) => questions.length > 0,
        message: "Quiz must contain at least one question.",
      },
    },

    totalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);

// Automatically calculate total marks before saving
quizSchema.pre("save", function () {
  this.totalMarks = this.questions.reduce(
    (total, question) => total + question.marks,
    0
  );

  if (this.passingMarks > this.totalMarks) {
    throw new Error("Passing marks cannot exceed total marks.");
  }
});

quizSchema.index({ classNo: 1, subject: 1, chapter: 1 });

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
