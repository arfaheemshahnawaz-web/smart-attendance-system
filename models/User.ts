import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      required: true,
    },
    status: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "pending",
},

collegeId: {
  type: String,
  required: true, // Roll No / Employee ID
},

divisionId: {
  type: Schema.Types.ObjectId,
  ref: "Division",
  default: null, // only for students
},

  },
  { timestamps: true }
);

export const User = models.User || mongoose.model("User", UserSchema);
