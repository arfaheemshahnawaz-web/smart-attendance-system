export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { Timetable } from "@/models/Timetable";
import "@/models/Division";
import "@/models/Batch";
import "@/models/Subject";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    if (decoded.role !== "teacher") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    const timetable = await Timetable.find({
      teacherId: decoded.userId,
      isActive: true,
    })
    .sort({hourSlot: 1 })
      .populate({
        path: "divisionId",
        populate: {
          path: "batchId",
          select: "name academicYear",
        },
      })
      .populate("subjectId", "name");

    const grouped: any = {};

    timetable.forEach((slot: any) => {
      const batch = slot.divisionId.batchId;

      const batchKey = `${batch.name} ${batch.academicYear}`;

      if (!grouped[batchKey]) {
        grouped[batchKey] = {
          batch: batchKey,
          divisions: [],
        };
      }

      grouped[batchKey].divisions.push({
        division: slot.divisionId.name,
        subject: slot.subjectId.name,
        day: slot.day,
        hourSlot: slot.hourSlot,
      });
    });

    return NextResponse.json(Object.values(grouped));
  } catch (error) {
    console.error("MY CLASSES ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load teacher classes" },
      { status: 500 }
    );
  }
}