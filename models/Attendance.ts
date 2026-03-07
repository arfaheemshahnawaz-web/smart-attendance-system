import mongoose, { Schema, models } from "mongoose";

const AttendanceSchema = new Schema(
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
    markedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["present", "rejected"],
      default: "present",
    },
    reason: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Attendance =
  models.Attendance || mongoose.model("Attendance", AttendanceSchema);
