export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { Attendance } from "@/models/Attendance";
import { AttendanceSession } from "@/models/AttendanceSession";
import { Timetable } from "@/models/Timetable";

export async function GET(req: Request) {
  try {
    const token = req.headers
      .get("authorization")
      ?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET!
    );

    await connectDB();

    // 🔎 Get sessions based on role
    let sessionQuery: any = {};

    if (decoded.role === "teacher") {
      sessionQuery.teacherId = decoded.userId;
    }

    const sessions = await AttendanceSession.find(
      sessionQuery
    );

    const sessionIds = sessions.map((s) => s._id);

    const attendance = await Attendance.find({
      sessionId: { $in: sessionIds },
    }).populate("sessionId");

    const totalSessions = sessions.length;
    const attendedSessions = attendance.length;

    const overallPercentage =
      totalSessions === 0
        ? 0
        : Math.round(
            (attendedSessions / totalSessions) * 100
          );

    // 📅 Day-wise
    const dayMap: any = {};
    attendance.forEach((a: any) => {
      const day = new Date(
        a.sessionId.startTime
      ).toLocaleDateString("en-US", {
        weekday: "short",
      });
      dayMap[day] = (dayMap[day] || 0) + 1;
    });

    const dayWise = Object.keys(dayMap).map((d) => ({
      day: d,
      count: dayMap[d],
    }));

    // 📘 Subject-wise
    const subjectMap: any = {};
    sessions.forEach((s) => {
      subjectMap[s.subject] =
        subjectMap[s.subject] || { total: 0, present: 0 };
      subjectMap[s.subject].total++;
    });

    attendance.forEach((a: any) => {
      subjectMap[a.sessionId.subject].present++;
    });

    const subjectWise = Object.keys(subjectMap).map(
      (sub) => ({
        subject: sub,
        percentage: Math.round(
          (subjectMap[sub].present /
            subjectMap[sub].total) *
            100
        ),
      })
    );

    return NextResponse.json({
      overallPercentage,
      totalSessions,
      attendedSessions,
      dayWise,
      subjectWise,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}
