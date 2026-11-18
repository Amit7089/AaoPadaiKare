
import mongoose from "mongoose";

const courseLessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseSubject",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    chapter: {
      type: String,
      default: "",
      trim: true,
    },

    language: {
      type: String,
      enum: ["Hindi", "English"],
      required: true,
      default: "Hindi",
    },

    content: {
      type: String,
      default: "",
    },

    videoUrl: {
      type: String,
      default: "",
      trim: true,
    },

    pdfUrl: {
      type: String,
      default: "",
      trim: true,
    },

    pdfName: {
      type: String,
      default: "",
      trim: true,
    },

    pdfPublicId: {
      type: String,
      default: "",
    },

    pdfResourceType: {
      type: String,
      default: "raw",
    },

    pdfDeliveryType: {
      type: String,
      enum: ["upload", "authenticated"],
      default: "authenticated",
    },

    accessType: {
      type: String,
      enum: ["demo", "premium"],
      default: "premium",
      index: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

courseLessonSchema.index({
  course: 1,
  subject: 1,
  language: 1,
  displayOrder: 1,
});

const CourseLesson = mongoose.model(
  "CourseLesson",
  courseLessonSchema
);

export default CourseLesson;
