export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Timetable } from "@/models/Timetable";
import { Subject } from "@/models/Subject";
import { Division } from "@/models/Division";
import { FaceProfile } from "@/models/FaceProfile";

Subject;
Division;


export async function GET(req: Request) {
  try {
    // 🔐 Auth

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    const faceProfile = await FaceProfile.findOne({
  userId: decoded.userId,
  isVerified: true,
});

if (!faceProfile) {
  return NextResponse.json(
    { error: "Face not registered" },
    { status: 403 }
  );
}

    if (decoded.role !== "student") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    // 🔎 Load student
    const student = await User.findById(decoded.userId)
      .select("divisionId status");

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    if (student.status !== "approved") {
      return NextResponse.json(
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    if (!student.divisionId) {
      return NextResponse.json(
        { error: "Student not assigned to any division" },
        { status: 400 }
      );
    }

    // 📅 Fetch timetable for student's division
    const timetable = await Timetable.find({
      divisionId: student.divisionId,
      isActive: true,
    })
      .populate("subjectId", "name")
      .populate("teacherId", "name")
      .sort({ day: 1, hourSlot: 1 });

    // 🧾 Normalize response
    const result = timetable.map((t) => ({
      _id: t._id,
      day: t.day,
      hourSlot: t.hourSlot,
      subject: {
        _id: t.subjectId._id,
        name: t.subjectId.name,
      },
      teacher: {
        _id: t.teacherId._id,
        name: t.teacherId.name,
      },
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("STUDENT TIMETABLE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable" },
      { status: 500 }
    );
  }
}
