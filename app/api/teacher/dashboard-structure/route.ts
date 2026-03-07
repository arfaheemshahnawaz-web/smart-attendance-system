export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { Timetable } from "@/models/Timetable";
import "@/models/Division";
import "@/models/Batch";
import "@/models/Subject";

function getCurrentIST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

function getCurrentDay() {
  const now = getCurrentIST();

  const days = [
    "Sunday","Monday","Tuesday","Wednesday",
    "Thursday","Friday","Saturday"
  ];

  return days[now.getDay()];
}

function getHourStatus(hourSlot: string) {
  const now = getCurrentIST().getHours();

  const start = parseInt(hourSlot.split(":")[0]);
  const end = parseInt(hourSlot.split("-")[1]);

  if (now >= start && now < end) return "active";
  if (now >= end) return "completed";

  return "upcoming";
}

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

    const day = getCurrentDay();

    const timetable = await Timetable.find({
      teacherId: decoded.userId,
      day,
      isActive: true
    })
      .populate({
        path: "divisionId",
        populate: { path: "batchId" }
      })
      .populate("subjectId");

    const batches: any = {};

    timetable.forEach((slot: any) => {

      const batchName = slot.divisionId.batchId.name + " " +
        slot.divisionId.batchId.academicYear;

      const divisionName = slot.divisionId.name;

      if (!batches[batchName]) {
        batches[batchName] = {};
      }

      if (!batches[batchName][divisionName]) {
        batches[batchName][divisionName] = [];
      }

      batches[batchName][divisionName].push({
        subject: slot.subjectId.name,
        hourSlot: slot.hourSlot,
        status: getHourStatus(slot.hourSlot)
      });

    });

    const result = Object.keys(batches).map(batch => ({
      batch,
      divisions: Object.keys(batches[batch]).map(div => ({
        division: div,
        classes: batches[batch][div]
      }))
    }));

    return NextResponse.json(result);

  } catch (err) {

    console.error(err);

    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );

  }

}