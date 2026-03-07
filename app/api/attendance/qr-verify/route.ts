export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { AttendanceSession } from "@/models/AttendanceSession";
import { PendingAttendance } from "@/models/PendingAttendance";

export async function POST(req: Request) {
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

    if (decoded.role !== "student") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { sessionId, qrToken } = await req.json();

    await connectDB();

    const session = await AttendanceSession.findById(
      sessionId
    );

    if (
      !session ||
      !session.isActive ||
      session.currentQrToken !== qrToken ||
      session.qrExpiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "Invalid or expired QR" },
        { status: 400 }
      );
    }

    // 🔁 Remove old pending
    await PendingAttendance.deleteMany({
      studentId: decoded.userId,
      sessionId,
    });

    await PendingAttendance.create({
      studentId: decoded.userId,
      sessionId,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    });

    return NextResponse.json({
      message: "QR verified. Proceed to face verification",
    });
  } catch {
    return NextResponse.json(
      { error: "QR verification failed" },
      { status: 500 }
    );
  }
}
