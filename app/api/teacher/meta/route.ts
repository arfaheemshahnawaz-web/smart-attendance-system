export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Batch } from "@/models/Batch";
import { Division } from "@/models/Division";

export async function GET() {
  await connectDB();

  const batches = await Batch.find({ isActive: true });

  const divisions = await Division.find({ isActive: true });

  return NextResponse.json({
    batches,
    divisions
  });
}