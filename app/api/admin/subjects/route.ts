export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { Subject } from "@/models/Subject";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { name, code, batchId, semester } = await req.json();

    if (!name || !code || !batchId || !semester) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await connectDB();

    const subject = await Subject.create({
      name,
      code,
      batchId,
      semester,
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (err: any) {
    console.error("SUBJECT CREATE ERROR:", err);
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "Subject already exists for this batch" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");

    await connectDB();

    const query: any = { isActive: true };
    if (batchId) query.batchId = batchId;

    const subjects = await Subject.find(query).sort({ semester: 1 });

    return NextResponse.json(subjects);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
