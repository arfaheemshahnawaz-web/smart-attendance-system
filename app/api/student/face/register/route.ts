export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { FaceProfile } from "@/models/FaceProfile";

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

    const { descriptor } = await req.json();

    if (!descriptor || descriptor.length === 0) {
      return NextResponse.json(
        { error: "Face descriptor required" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await FaceProfile.findOne({
      studentId: decoded.userId,
    });

    if (existing) {
      return NextResponse.json(
        { error: "Face already registered" },
        { status: 409 }
      );
    }

    await FaceProfile.create({
      studentId: decoded.userId,
      descriptor,
    });

    return NextResponse.json({
      message: "Face registered successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Face registration failed" },
      { status: 500 }
    );
  }
}
