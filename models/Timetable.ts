import mongoose, { Schema, models } from "mongoose";

const TimetableSchema = new Schema(
  {
    divisionId: {
      type: Schema.Types.ObjectId,
      ref: "Division",
      required: true,
    },

    day: {
      type: String,
      required: true,
    },

    hourSlot: {
      type: String,
      required: true,
    },

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

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* Prevent two subjects in same division at same time */
TimetableSchema.index(
  { divisionId: 1, day: 1, hourSlot: 1 },
  { unique: true }
);

/* Prevent teacher from having two classes at same time */
TimetableSchema.index(
  { teacherId: 1, day: 1, hourSlot: 1 },
  { unique: true }
);

export const Timetable =
  models.Timetable || mongoose.model("Timetable", TimetableSchema);