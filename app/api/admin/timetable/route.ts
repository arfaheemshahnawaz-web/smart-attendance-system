export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { Timetable } from "@/models/Timetable";
import { Subject } from "@/models/Subject";
import { SubjectTeacher } from "@/models/SubjectTeacher";

export async function POST(req: Request) {
  try {
    // 🔐 Auth
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { batchId, divisionId, day, hourSlot, subjectId } =
      await req.json();

    if (!batchId || !divisionId || !day || !hourSlot || !subjectId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    // 1️⃣ Validate subject
    const subject = await Subject.findById(subjectId);
    if (!subject || subject.batchId.toString() !== batchId) {
      return NextResponse.json(
        { error: "Invalid subject for selected batch" },
        { status: 400 }
      );
    }

    // 2️⃣ Find assigned teacher for subject
    const subjectTeacher = await SubjectTeacher.findOne({
      subjectId,
      batchId,
    });

    if (!subjectTeacher) {
      return NextResponse.json(
        { error: "No teacher assigned to this subject" },
        { status: 400 }
      );
    }

    const teacherId = subjectTeacher.teacherId;

    // 3️⃣ Prevent division clash
    const divisionClash = await Timetable.findOne({
      divisionId,
      day,
      hourSlot,
      isActive: true,
    });

    if (divisionClash) {
      return NextResponse.json(
        { error: "This division already has a class in this slot" },
        { status: 409 }
      );
    }

    // 4️⃣ Prevent teacher time clash across batches
    const teacherClash = await Timetable.findOne({
      teacherId,
      day,
      hourSlot,
      isActive: true,
    });

    if (teacherClash) {
      return NextResponse.json(
        {
          error:
            "Teacher already assigned to another batch at this time",
        },
        { status: 409 }
      );
    }

    // 5️⃣ Create timetable entry
    const timetable = await Timetable.create({
      batchId,
      divisionId,
      day,
      hourSlot,
      subjectId,
      teacherId,
    });

    return NextResponse.json(
      {
        message: "Timetable created successfully",
        timetable,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("TIMETABLE CREATE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create timetable" },
      { status: 500 }
    );
  }
}
