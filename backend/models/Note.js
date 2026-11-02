
import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    pdfUrl: {
      type: String,
      default: "",
    },
    pdfName: {
      type: String,
      default: "",
    },
    youtubeUrl: {
      type: String,
      default: "",
      trim: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Note = mongoose.model("Note", noteSchema);

export default Note;
