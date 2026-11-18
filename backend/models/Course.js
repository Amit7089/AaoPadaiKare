
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    examCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "scholarship",
        "school-entrance",
        "olympiad",
        "foundation",
        "other",
      ],
    },

    targetClasses: {
      type: [Number],
      required: true,
      validate: {
        validator: (classes) =>
          classes.length > 0 &&
          classes.every((value) => value >= 1 && value <= 12),
        message: "Please select valid target classes.",
      },
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    eligibility: {
      type: String,
      default: "",
      trim: true,
    },

    supportedLanguages: {
      type: [String],
      enum: ["Hindi", "English"],
      default: ["Hindi", "English"],
    },

    thumbnailUrl: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    compareAtPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    durationDays: {
      type: Number,
      default: 365,
      min: 1,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({
  category: 1,
  isPublished: 1,
  displayOrder: 1,
});

courseSchema.index({
  targetClasses: 1,
  isPublished: 1,
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
