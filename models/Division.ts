import mongoose, { Schema, models } from "mongoose";

const DivisionSchema = new Schema(
  {
    name: {
      type: String,
      required: true, // S3-A
    },
    semester: {
      type: Number,
      required: true, // 3, 4
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    classTeacherId: {
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

// Prevent duplicate divisions in same batch
DivisionSchema.index(
  { name: 1, batchId: 1 },
  { unique: true }
);

export const Division =
  models.Division || mongoose.model("Division", DivisionSchema);
