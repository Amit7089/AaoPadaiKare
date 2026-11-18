
import mongoose from "mongoose";

const liveClassSchema = new mongoose.Schema(
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

    description: {
      type: String,
      default: "",
      trim: true,
    },

    platform: {
      type: String,
      enum: ["zoom", "google_meet"],
      required: true,
    },

    meetingUrl: {
      type: String,
      required: true,
      trim: true,
    },

    scheduledAt: {
      type: Date,
      required: true,
    },

    durationMinutes: {
      type: Number,
      default: 60,
      min: 1,
    },

    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled"],
      default: "scheduled",
    },

    recordingUrl: {
      type: String,
      default: "",
      trim: true,
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

liveClassSchema.index({
  classNo: 1,
  scheduledAt: 1,
});

const LiveClass = mongoose.model(
  "LiveClass",
  liveClassSchema
);

export default LiveClass;
