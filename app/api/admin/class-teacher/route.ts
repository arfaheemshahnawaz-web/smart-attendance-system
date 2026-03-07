export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { ClassTeacherAssignment } from "@/models/ClassTeacherAssignment";
import { User } from "@/models/User";
import { Division } from "@/models/Division";

export async function POST(req: Request) {
  try {

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { divisionId, teacherId } = await req.json();

    if (!divisionId || !teacherId) {
      return NextResponse.json(
        { error: "divisionId and teacherId are required" },
        { status: 400 }
      );
    }

    await connectDB();

    /* Validate division */

    const division = await Division.findById(divisionId);

    if (!division) {
      return NextResponse.json(
        { error: "Division not found" },
        { status: 404 }
      );
    }


    /* Validate teacher */

    const teacher = await User.findById(teacherId);

    if (!teacher || teacher.role !== "teacher") {
      return NextResponse.json(
        { error: "Invalid teacher" },
        { status: 400 }
      );
    }


    /* 🚨 CHECK IF TEACHER ALREADY CLASS TEACHER */

    const existingTeacherAssignment =
      await ClassTeacherAssignment.findOne({ teacherId });

    if (
      existingTeacherAssignment &&
      existingTeacherAssignment.divisionId.toString() !== divisionId
    ) {
      return NextResponse.json(
        {
          error:
            "This teacher is already assigned as class teacher to another division",
        },
        { status: 400 }
      );
    }


    /* UPSERT DIVISION ASSIGNMENT */

    const assignment = await ClassTeacherAssignment.findOneAndUpdate(
      { divisionId },
      { teacherId },
      { upsert: true, new: true }
    );


    return NextResponse.json({
      message: "Class teacher assigned successfully",
      assignment,
    });

  } catch (error) {

    console.error("Assign class teacher error:", error);

    return NextResponse.json(
      { error: "Failed to assign class teacher" },
      { status: 500 }
    );

  }
}
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const divisionId = searchParams.get("divisionId");

    if (!divisionId) {
      return NextResponse.json(
        { error: "divisionId is required" },
        { status: 400 }
      );
    }

    const assignment = await ClassTeacherAssignment.findOne({ divisionId })
      .populate("teacherId", "name email");

    return NextResponse.json(assignment);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch class teacher" },
      { status: 500 }
    );
  }
}
