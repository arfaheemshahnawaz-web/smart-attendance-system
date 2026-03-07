import mongoose, { Schema, models } from "mongoose";

const SubjectTeacherSchema = new Schema(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    batchId: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
  },
  { timestamps: true }
);

// ❗ Prevent same teacher taking 2 subjects in same batch
SubjectTeacherSchema.index(
  { teacherId: 1, subjectId: 1 },
  { unique: true }
);

export const SubjectTeacher =
  models.SubjectTeacher ||
  mongoose.model("SubjectTeacher", SubjectTeacherSchema);
