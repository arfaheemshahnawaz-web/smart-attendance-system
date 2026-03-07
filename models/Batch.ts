import mongoose, { Schema, models } from "mongoose";

const BatchSchema = new Schema(
  {
    name: {
      type: String,
      required: true, // MCA
    },
    academicYear: {
      type: String,
      required: true, // 2023-2025
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ✅ Compound unique index
BatchSchema.index(
  { name: 1, academicYear: 1 },
  { unique: true }
);

export const Batch =
  models.Batch || mongoose.model("Batch", BatchSchema);
