export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { FaceProfile } from "@/models/FaceProfile";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = auth.split(" ")[1];
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    if (decoded.role !== "student") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { descriptor } = await req.json();

    if (!descriptor || !Array.isArray(descriptor)) {
      return NextResponse.json(
        { error: "Invalid face data" },
        { status: 400 }
      );
    }

    await connectDB();

    // Prevent re-registration
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
      descriptors: [descriptor],
    });

    return NextResponse.json({
      message: "Face registered successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Face registration failed" },
      { status: 500 }
    );
  }
}
