
import mongoose from "mongoose";

const courseSubjectSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

courseSubjectSchema.index({ course: 1, displayOrder: 1 });

const CourseSubject = mongoose.model(
  "CourseSubject",
  courseSubjectSchema
);

export default CourseSubject;
