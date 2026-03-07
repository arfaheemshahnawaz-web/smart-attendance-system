import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, role, collegeId } = await req.json();

    // 🔴 Validation
    if (!name || !email || !password || !role || !collegeId) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    // 🔴 Prevent duplicate registration
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔐 Create user as PENDING
    await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      collegeId,          // Roll no / Employee ID
      status: "pending",  // ❗ Admin must approve
    });

    return NextResponse.json(
      {
        message:
          "Registration successful. Await admin approval before login.",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
