export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { AttendanceSession } from "@/models/AttendanceSession";
import { Attendance } from "@/models/Attendance";
import { User } from "@/models/User";
import { Division } from "@/models/Division";

export async function GET(req: Request) {
  try {
    // 🔐 Auth
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET!);

    const { searchParams } = new URL(req.url);
    const divisionId = searchParams.get("divisionId");

    if (!divisionId) {
      return NextResponse.json(
        { error: "divisionId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // 🏫 Get division to know className
    const division = await Division.findById(divisionId);
    if (!division) {
      return NextResponse.json(
        { error: "Invalid division" },
        { status: 404 }
      );
    }

    // You are using className as label like "MCA S4"
    const className = division.name;

    // 📘 Sessions for this class
    const sessions = await AttendanceSession.find({ className });
    const totalSessions = sessions.length;

    if (totalSessions === 0) {
      return NextResponse.json([]);
    }

    const sessionIds = sessions.map((s) => s._id);

    // 👩‍🎓 Students of this division
    const students = await User.find({
      role: "student",
      divisionId,
      status: "approved",
    });

    // 📊 Attendance records
    const attendance = await Attendance.find({
      sessionId: { $in: sessionIds },
    });

    // 🧮 Calculate percentage
    const report = students.map((student) => {
      const attended = attendance.filter(
        (a) => a.studentId.toString() === student._id.toString()
      ).length;

      const percentage =
        totalSessions > 0
          ? ((attended / totalSessions) * 100).toFixed(2)
          : "0.00";

      return {
        studentId: student._id,
        name: student.name,
        email: student.email,
        collegeId: student.collegeId,
        attended,
        total: totalSessions,
        percentage,
      };
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch student percentage" },
      { status: 500 }
    );
  }
}
