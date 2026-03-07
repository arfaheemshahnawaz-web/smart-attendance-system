// app/api/admin/student-division/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
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

    const { studentId, divisionId } = await req.json();
    if (!studentId || !divisionId) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const division = await Division.findById(divisionId);
    if (!division) {
      return NextResponse.json(
        { error: "Division not found" },
        { status: 404 }
      );
    }

    await User.findByIdAndUpdate(studentId, {
      divisionId,
    });

    return NextResponse.json({
      message: "Student assigned to division successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to assign student" },
      { status: 500 }
    );
  }
}
