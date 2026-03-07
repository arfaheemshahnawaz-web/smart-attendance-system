import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { FaceProfile } from "@/models/FaceProfile";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    await connectDB();

    const user = await User.findById(decoded.userId)
      .select("name divisionId")
      .populate("divisionId", "name semester");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🔑 CHECK FACE PROFILE
    const faceProfile = await FaceProfile.findOne({
      userId: decoded.userId,
      isVerified: true,
    });

    return NextResponse.json({
      name: user.name,
      division: user.divisionId,
      faceVerified: !!faceProfile, // 🔥 THIS WAS MISSING
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}