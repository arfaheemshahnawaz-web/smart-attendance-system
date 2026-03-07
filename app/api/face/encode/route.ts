import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { FaceProfile } from "@/models/FaceProfile";
import * as faceapi from "@vladmandic/face-api";
import canvas from "canvas";
import path from "path";
import { getFaceEmbedding } from "@/lib/face-api";

export const runtime = "nodejs";

const { Canvas, Image, ImageData } = canvas as any;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  const modelPath = path.join(process.cwd(), "public/models");
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  modelsLoaded = true;
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const token = auth.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ message: "Image required" }, { status: 400 });
    }

    await connectDB();
    await loadModels();

    const base64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
   const img = await canvas.loadImage(buffer);

// 🔥 FORCE CORRECT INPUT SIZE
const SIZE = 224;
const faceCanvas = canvas.createCanvas(SIZE, SIZE);
const ctx = faceCanvas.getContext("2d");

// resize image to model input size
ctx.drawImage(img, 0, 0, SIZE, SIZE);

    const detection = await faceapi
      .detectSingleFace(
        faceCanvas as unknown as faceapi.TNetInput,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5,
        })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return NextResponse.json({ message: "No face detected" }, { status: 400 });
    }

    let profile = await FaceProfile.findOne({ userId: decoded.userId });
    if (!profile) {
      profile = await FaceProfile.create({
        userId: decoded.userId,
        getFaceEmbeddings: Array.from(detection.descriptor),
      });
    } else {
      profile.faceEmbeddings = Array.from(detection.descriptor);
      await profile.save();
    }

    return NextResponse.json({ message: "Face encoded successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}