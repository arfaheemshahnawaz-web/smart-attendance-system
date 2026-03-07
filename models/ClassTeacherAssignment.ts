import mongoose, { Schema, models } from "mongoose";

const ClassTeacherAssignmentSchema = new Schema(
  {
    divisionId: {
      type: Schema.Types.ObjectId,
      ref: "Division",
      required: true,
      unique: true, // one class teacher per division
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const ClassTeacherAssignment =
  models.ClassTeacherAssignment ||
  mongoose.model("ClassTeacherAssignment", ClassTeacherAssignmentSchema);
