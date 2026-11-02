
import mongoose from "mongoose";

const syllabusSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

// Same class mein same subject ka same chapter duplicate nahi hoga.
syllabusSchema.index(
  { classNo: 1, subject: 1, chapter: 1 },
  { unique: true }
);

const Syllabus = mongoose.model("Syllabus", syllabusSchema);

export default Syllabus;
