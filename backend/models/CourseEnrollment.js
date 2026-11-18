import mongoose from "mongoose";

const courseEnrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    // Student's selected course language
    language: {
      type: String,
      enum: ["Hindi", "English"],
      required: true,
      default: "Hindi",
    },

    // Payment details
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    status: {
      type: String,
      enum: ["pending", "active", "expired", "failed", "cancelled"],
      default: "pending",
      index: true,
    },

    razorpayOrderId: {
      type: String,
      default: undefined,
    },

    razorpayPaymentId: {
      type: String,
      default: undefined,
    },

    razorpaySignature: {
      type: String,
      default: "",
      select: false,
    },

    purchasedAt: {
      type: Date,
      default: null,
    },

    startsAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

courseEnrollmentSchema.index({
  student: 1,
  course: 1,
  status: 1,
});

courseEnrollmentSchema.index(
  { razorpayOrderId: 1 },
  { unique: true, sparse: true },
);

courseEnrollmentSchema.index(
  { razorpayPaymentId: 1 },
  { unique: true, sparse: true },
);

const CourseEnrollment = mongoose.model(
  "CourseEnrollment",
  courseEnrollmentSchema,
);

export default CourseEnrollment;
