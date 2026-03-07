export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";

import { Division } from "@/models/Division";
import { Subject } from "@/models/Subject";
import { SubjectTeacher } from "@/models/SubjectTeacher";
import { Timetable } from "@/models/Timetable";

export async function POST(req: Request) {

  try {

    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const { batchId } = await req.json();

    if (!batchId) {
      return NextResponse.json(
        { error: "batchId required" },
        { status: 400 }
      );
    }

    await connectDB();

    /* 1️⃣ Get divisions */

    const divisions = await Division.find({
      batchId,
      isActive: true
    });

    if (!divisions.length) {
      return NextResponse.json(
        { error: "No divisions found for batch" },
        { status: 404 }
      );
    }

    /* 2️⃣ Get current semester */

    const currentSemester = divisions[0].semester;

    const nextSemester = currentSemester + 1;

    /* 3️⃣ Update divisions */

    await Division.updateMany(
      { batchId },
      { semester: nextSemester }
    );

    /* 4️⃣ Deactivate subjects of old semester */

    await Subject.updateMany(
      {
        batchId,
        semester: currentSemester
      },
      { isActive: false }
    );

    /* 5️⃣ Remove subject teacher assignments */

    await SubjectTeacher.deleteMany({
      batchId
    });

    /* 6️⃣ Deactivate timetable */

    await Timetable.updateMany(
      {
        divisionId: { $in: divisions.map(d => d._id) }
      },
      { isActive: false }
    );

    return NextResponse.json({

      message: "Semester promoted successfully",

      previousSemester: currentSemester,

      newSemester: nextSemester

    });

  } catch (error) {

    console.error("PROMOTE SEMESTER ERROR:", error);

    return NextResponse.json(
      { error: "Failed to promote semester" },
      { status: 500 }
    );

  }

}