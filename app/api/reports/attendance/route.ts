export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { Attendance } from "@/models/Attendance";
import { AttendanceSession } from "@/models/AttendanceSession";
import { User } from "@/models/User";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;

    await connectDB();

    const { searchParams } = new URL(req.url);
    const className = searchParams.get("className");

    if (!className) {
      return NextResponse.json(
        { error: "className is required" },
        { status: 400 }
      );
    }

    // 🔎 Fetch sessions
    const sessionQuery: any = { className };

    if (decoded.role === "teacher") {
      sessionQuery.teacherId = decoded.userId;
    }

    const sessions = await AttendanceSession.find(sessionQuery);

    const sessionIds = sessions.map((s) => s._id);

    // 🔎 Fetch attendance records
    const attendanceRecords = await Attendance.find({
      sessionId: { $in: sessionIds },
    }).populate("studentId", "name collegeId");

    // 🧮 Percentage calculation
    const studentStats: any = {};

    attendanceRecords.forEach((record: any) => {
      const studentId = record.studentId._id.toString();

      if (!studentStats[studentId]) {
        studentStats[studentId] = {
          studentId,
          name: record.studentId.name,
          collegeId: record.studentId.collegeId,
          attended: 0,
        };
      }

      studentStats[studentId].attended += 1;
    });

    const totalClasses = sessions.length;

    const percentages = Object.values(studentStats).map(
      (s: any) => ({
        ...s,
        totalClasses,
        percentage:
          totalClasses > 0
            ? ((s.attended / totalClasses) * 100).toFixed(2)
            : "0.00",
      })
    );

    return NextResponse.json({
      totalClasses,
      students: percentages,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate attendance percentage" },
      { status: 500 }
    );
  }
}
