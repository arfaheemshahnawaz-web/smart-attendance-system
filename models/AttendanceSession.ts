import mongoose, { Schema, models } from "mongoose";

const AttendanceSessionSchema = new Schema(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    divisionId: {
      type: Schema.Types.ObjectId,
      ref: "Division",
      required: true,
    },

    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    // ✅ ADD THESE
    day: {
      type: String,
      required: true, // Monday, Tuesday...
    },

    hourSlot: {
      type: String,
      required: true, // 09:00-10:00
    },

    date: {
      type: String,
      required: true, // yyyy-mm-dd
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    endedAt: {
      type: Date,
    },

    currentQrToken: {
      type: String,
      required: true,
    },

    qrExpiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export const AttendanceSession =
  models.AttendanceSession ||
  mongoose.model("AttendanceSession", AttendanceSessionSchema);