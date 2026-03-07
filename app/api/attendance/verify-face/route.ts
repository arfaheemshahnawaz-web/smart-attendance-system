export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { FaceProfile } from "@/models/FaceProfile";

/* 🧠 Cosine similarity */
function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ verified: false }, { status: 401 });
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    const { liveEmbedding } = await req.json();
    if (!Array.isArray(liveEmbedding)) {
      return NextResponse.json(
        { verified: false },
        { status: 400 }
      );
    }

    await connectDB();

    const profile = await FaceProfile.findOne({
      userId: decoded.userId,
      isVerified: true,
    });

    if (!profile) {
      return NextResponse.json(
        { verified: false },
        { status: 403 }
      );
    }

    const maxScore = Math.max(
      ...profile.faceEmbeddings.map((stored: number[]) =>
        cosineSimilarity(stored, liveEmbedding)
      )
    );

    return NextResponse.json({
      verified: maxScore > 0.6,
      score: maxScore,
    });
  } catch (err) {
    console.error("FACE VERIFY ERROR:", err);
    return NextResponse.json(
      { verified: false },
      { status: 500 }
    );
  }
}