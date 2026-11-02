
import mongoose from "mongoose";

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
    membership: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
