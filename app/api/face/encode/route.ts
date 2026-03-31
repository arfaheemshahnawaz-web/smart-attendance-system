import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { FaceProfile } from "@/models/FaceProfile";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let modelsLoaded = false;
let faceapiInstance: typeof import("@vladmandic/face-api") | null = null;
let canvasInstance: typeof import("canvas") | null = null;

async function initFaceAPI() {
  if (faceapiInstance && modelsLoaded) return;

  const [faceapiModule, canvasModule] = await Promise.all([
    import("@vladmandic/face-api"),
    import("canvas"),
  ]);

  faceapiInstance = faceapiModule;
  canvasInstance = canvasModule;

const { Canvas, Image, ImageData } = canvasModule as any;
  faceapiInstance.env.monkeyPatch({ Canvas, Image, ImageData });

  if (!modelsLoaded) {
    const modelPath = path.join(process.cwd(), "public/models");
    await faceapiInstance.nets.tinyFaceDetector.loadFromDisk(modelPath);
    await faceapiInstance.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapiInstance.nets.faceRecognitionNet.loadFromDisk(modelPath);
    modelsLoaded = true;
  }
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const token = auth.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ message: "Image required" }, { status: 400 });
    }

    await connectDB();
    await initFaceAPI();

    const faceapi = faceapiInstance!;
const canvas = canvasInstance! as any;
    const base64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    const img = await canvas.loadImage(buffer);

    const SIZE = 224;
    const faceCanvas = canvas.createCanvas(SIZE, SIZE);
    const ctx = faceCanvas.getContext("2d");
    ctx.drawImage(img, 0, 0, SIZE, SIZE);

    const detection = await faceapi
      .detectSingleFace(
        faceCanvas as unknown as import("@vladmandic/face-api").TNetInput,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5,
        })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return NextResponse.json(
        { message: "No face detected" },
        { status: 400 }
      );
    }

    let profile = await FaceProfile.findOne({ userId: decoded.userId });
    if (!profile) {
      profile = await FaceProfile.create({
        userId: decoded.userId,
        faceEmbeddings: Array.from(detection.descriptor),
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