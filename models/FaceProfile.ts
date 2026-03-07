// models/FaceProfile.ts
import mongoose, { Schema, models } from "mongoose";

const FaceProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    faceEmbeddings: {
      type: [[Number]], // array of 128-d vectors
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const FaceProfile =
  models.FaceProfile ||
  mongoose.model("FaceProfile", FaceProfileSchema);
