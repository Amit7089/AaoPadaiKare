
import mongoose from "mongoose";

const questionPaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
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

    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },

    paperType: {
      type: String,
      enum: ["question-paper", "solved-paper"],
      required: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    accessType: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },

    pdfUrl: {
      type: String,
      default: "",
    },

    pdfName: {
      type: String,
      default: "",
    },

    pdfPublicId: {
      type: String,
      default: "",
    },

    pdfResourceType: {
      type: String,
      default: "image",
    },

    pdfDeliveryType: {
      type: String,
      enum: ["upload", "authenticated"],
      default: "authenticated",
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

questionPaperSchema.index({
  classNo: 1,
  subject: 1,
  year: -1,
  paperType: 1,
});

const QuestionPaper = mongoose.model(
  "QuestionPaper",
  questionPaperSchema
);

export default QuestionPaper;
