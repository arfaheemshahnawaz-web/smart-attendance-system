import { NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { FaceProfile } from "@/models/FaceProfile";

export const runtime = "nodejs";

function euclidean(a: number[], b: number[]) {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0)
  );
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth)
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );

    const token = auth.split(" ")[1];

    let decoded: JwtPayload & { userId: string };

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as JwtPayload & { userId: string };
    } catch {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const descriptor = body?.descriptor;

    if (
      !descriptor ||
      !Array.isArray(descriptor) ||
      descriptor.length !== 128
    ) {
      return NextResponse.json(
        { message: "Valid descriptor required" },
        { status: 400 }
      );
    }

    await connectDB();

    const profile = await FaceProfile.findOne({
      userId: decoded.userId,
    }).lean();

    if (
      !profile ||
      !profile.faceEmbeddings ||
      profile.faceEmbeddings.length === 0
    ) {
      return NextResponse.json(
        { message: "Face not enrolled" },
        { status: 400 }
      );
    }

    const distances = profile.faceEmbeddings
      .filter(
        (embedding: number[]) =>
          Array.isArray(embedding) &&
          embedding.length === 128
      )
      .map((embedding: number[]) =>
        euclidean(descriptor, embedding)
      );

    if (distances.length === 0) {
      return NextResponse.json(
        { message: "Invalid stored embeddings" },
        { status: 400 }
      );
    }

    const minDistance = Math.min(...distances);

    return NextResponse.json({
      verified: minDistance < 0.6,
      distance: Number(minDistance.toFixed(4)),
    });

  } catch (err: any) {
    console.error("Face verify error:", err);

    return NextResponse.json(
      { message: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}