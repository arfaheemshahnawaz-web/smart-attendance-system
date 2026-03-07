export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { Batch } from "@/models/Batch";

export async function POST(req: Request) {
  try {
    // 🔐 Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    if (decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { name, academicYear } = await req.json();

    // 🔴 Validation
    if (!name || !academicYear) {
      return NextResponse.json(
        { error: "Batch name and academic year are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // ❌ Duplicate check
const existing = await Batch.findOne({
  name,
  academicYear,
});
    if (existing) {
      return NextResponse.json(
        { error: "Batch already exists" },
        { status: 409 }
      );
    }

    const batch = await Batch.create({
      name,
      academicYear,
    });

    return NextResponse.json(
      {
        message: "Batch created successfully",
        batch,
      },
      { status: 201 }
    );
  } catch (error: any) {
  console.error("Batch create error:", error);
  return NextResponse.json(
    { error: error.message || "Failed to create batch" },
    { status: 500 }
  );
}

}

export async function GET(req: Request) {
  try {
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

    const batches = await Batch.find({ isActive: true })
      .sort({ createdAt: -1 });

    return NextResponse.json(batches);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}
