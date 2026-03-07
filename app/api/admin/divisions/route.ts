export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { Division } from "@/models/Division";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { name, semester, batchId } = await req.json();

    if (!name || !semester || !batchId) {
      return NextResponse.json(
        { error: "name, semester and batchId are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const division = await Division.create({
      name,
      semester,
      batchId,
    });

    return NextResponse.json({
      message: "Division created successfully",
      division,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "Division already exists in this batch" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create division" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET!);

    await connectDB();

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");

    if (!batchId) {
      return NextResponse.json(
        { error: "batchId is required" },
        { status: 400 }
      );
    }

    const divisions = await Division.find({
      batchId,
      isActive: true,
    }).populate("classTeacherId", "name email");

    return NextResponse.json(divisions);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch divisions" },
      { status: 500 }
    );
  }
}
