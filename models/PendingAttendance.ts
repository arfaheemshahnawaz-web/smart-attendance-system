import mongoose, { Schema, models } from "mongoose";

const PendingAttendanceSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const PendingAttendance =
  models.PendingAttendance ||
  mongoose.model("PendingAttendance", PendingAttendanceSchema);
