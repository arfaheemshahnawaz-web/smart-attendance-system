import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Division } from "@/models/Division";
import { User } from "@/models/User";
import { ClassTeacherAssignment } from "@/models/ClassTeacherAssignment";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    /* ✅ FIXED PARAMS */
    const { id: divisionId } = await context.params;

    console.log("✅ Division ID received:", divisionId);

    /* 🚨 VALIDATE */
    if (!mongoose.Types.ObjectId.isValid(divisionId)) {
      return NextResponse.json(
        { error: "Invalid division ID" },
        { status: 400 }
      );
    }

    /* 🔥 GET DIVISION */
    const division = await Division.findById(divisionId);

    if (!division) {
      return NextResponse.json(
        { error: "Division not found" },
        { status: 404 }
      );
    }

    /* 🔥 STUDENTS */
    const students = await User.find({
      divisionId: division._id,
      role: "student"
    });

    /* 🔥 CLASS TEACHER */
    const assignment = await ClassTeacherAssignment.findOne({
      divisionId: division._id
    });

    let teacher = null;

    if (assignment) {
      teacher = await User.findById(assignment.teacherId);
    }

    if (!teacher && division.classTeacherId) {
      teacher = await User.findById(division.classTeacherId);
    }

    return NextResponse.json({
      _id: division._id.toString(),
      name: division.name,
      classTeacher: teacher?.name || null,
      students
    });

  } catch (error) {
    console.error("DIVISION API ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch division" },
      { status: 500 }
    );
  }
}