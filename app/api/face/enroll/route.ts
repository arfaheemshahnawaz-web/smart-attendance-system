export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { FaceProfile } from "@/models/FaceProfile";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = auth.split(" ")[1];
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET!
    );

    const { embeddings } = await req.json();

    if (
      !Array.isArray(embeddings) ||
      embeddings.length < 5
    ) {
      return NextResponse.json(
        { error: "At least 5 face samples required" },
        { status: 400 }
      );
    }

    await connectDB();

    await FaceProfile.findOneAndUpdate(
      { userId: decoded.userId },
      {
        userId: decoded.userId,
        faceEmbeddings: embeddings,
        isVerified: true,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: "Face enrolled successfully",
    });
  } catch (error) {
    console.error("FACE ENROLL ERROR:", error);
    return NextResponse.json(
      { error: "Failed to enroll face" },
      { status: 500 }
    );
  }
}