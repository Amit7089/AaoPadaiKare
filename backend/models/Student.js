
import mongoose from "mongoose";

const classMembershipSchema = new mongoose.Schema(
  {
    classNo: {
      type: Number,
      required: true,
      min: 6,
      max: 12,
    },
    plan: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "pending"],
      default: "pending",
    },
    purchasedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    paymentId: {
      type: String,
      default: "",
    },
    orderId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
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
    password: {
      type: String,
      required: true,
      select: false,
    },

    memberships: {
      type: [classMembershipSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
