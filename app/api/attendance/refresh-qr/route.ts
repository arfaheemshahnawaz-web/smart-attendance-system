import { connectDB } from "@/lib/db";
import { AttendanceSession } from "@/models/AttendanceSession";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export async function POST(req: Request) {
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

    if (decoded.role !== "teacher") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    await connectDB();

    const session = await AttendanceSession.findById(sessionId);
    if (!session || !session.isActive) {
      return NextResponse.json(
        { error: "Session not active" },
        { status: 400 }
      );
    }

    const newQrToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 1000);

    session.currentQrToken = newQrToken;
    session.qrExpiresAt = expiresAt;
    await session.save();

    return NextResponse.json({
      qrToken: newQrToken,
      expiresAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to refresh QR" },
      { status: 500 }
    );
  }
}
