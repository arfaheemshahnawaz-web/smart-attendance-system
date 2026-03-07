export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";

import { User } from "@/models/User";
import { Batch } from "@/models/Batch";
import { AttendanceSession } from "@/models/AttendanceSession";

export async function GET(req: Request) {
  try {
    // 🔐 Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    // 📊 Total users
    const users = await User.countDocuments();

    // ⏳ Pending approvals
    const pending = await User.countDocuments({
      status: "pending",
    });

    // 🎓 Total batches
    const batches = await Batch.countDocuments({
      isActive: true,
    });

    // 🕒 Active attendance sessions (current hour)
    const now = new Date();

    const activeSessions = await AttendanceSession.countDocuments({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    });

    return NextResponse.json({
      users,
      pending,
      batches,
      activeSessions,
    });
  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
