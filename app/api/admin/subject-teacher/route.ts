export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { Subject } from "@/models/Subject";
import { SubjectTeacher } from "@/models/SubjectTeacher";

export async function POST(req: Request) {
  try {
    // 🔐 Authentication
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { subjectId, teacherId } = await req.json();

    if (!subjectId || !teacherId) {
      return NextResponse.json(
        { error: "Missing subjectId or teacherId" },
        { status: 400 }
      );
    }

    await connectDB();

    // 1️⃣ Ensure subject exists
    const subject = await Subject.findById(subjectId);

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Prevent duplicate assignment
    /* 2️⃣ Check if subject already assigned */

const subjectAlreadyAssigned = await SubjectTeacher.findOne({
  subjectId
});

if (subjectAlreadyAssigned) {
  return NextResponse.json(
    { error: "This subject already has a teacher assigned" },
    { status: 409 }
  );
}

    // 3️⃣ Create assignment
    await SubjectTeacher.create({
      subjectId,
      teacherId,
      batchId: subject.batchId,
    });

    return NextResponse.json({
      message: "Subject assigned to teacher successfully",
    });

  } catch (err: any) {

    // MongoDB unique index safety
    if (err.code === 11000) {
      return NextResponse.json(
        {
          error: "Duplicate subject assignment detected",
        },
        { status: 409 }
      );
    }

    console.error("SUBJECT-TEACHER ERROR:", err);

    return NextResponse.json(
      { error: "Failed to assign subject to teacher" },
      { status: 500 }
    );
  }
}