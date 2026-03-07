import mongoose, { Schema, models } from "mongoose";

const SubjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    code: {
      type: String,
      required: true, // MCA301, MCA402 etc
    },

    semester: {
      type: Number,
      required: true,
    },

    batchId: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },

    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

SubjectSchema.index(
  { code: 1, batchId: 1 },
  { unique: true }
);

export const Subject =
  models.Subject || mongoose.model("Subject", SubjectSchema);
