
import mongoose from "mongoose";

const membershipPaymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
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
    amount: {
      type: Number,
      required: true, // Amount in paise
    },
    currency: {
      type: String,
      default: "INR",
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentId: {
      type: String,
    //   default: null,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "MembershipPayment",
  membershipPaymentSchema
);
