"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadFaceModels, getFaceEmbedding } from "@/lib/face-api";

export default function FaceRegisterPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  const [embeddings, setEmbeddings] = useState<number[][]>([]);
  const [capturing, setCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  /* =========================
     🎥 Load models + camera
     ========================= */
  useEffect(() => {
    let stream: MediaStream;

    async function init() {
      try {
        await loadFaceModels();

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }
      } catch (err) {
        setMessage("❌ Camera access failed");
      }
    }

    init();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /* =========================
     📸 Capture face
     ========================= */
  const captureFace = async () => {
    if (!videoRef.current || capturing) return;

    setCapturing(true);
    setMessage("Detecting face...");

    const descriptor = await getFaceEmbedding(videoRef.current);

    if (!descriptor) {
      setMessage("❌ No face detected. Try again.");
      setCapturing(false);
      return;
    }

    setEmbeddings((prev) => [...prev, Array.from(descriptor)]);
    setMessage(`✅ Captured ${embeddings.length + 1} / 5`);

    setTimeout(() => setCapturing(false), 800);
  };

  /* =========================
     🚀 Submit embeddings
     ========================= */
  const submitFace = async () => {
    if (embeddings.length < 5 || !token) return;

    setLoading(true);
    setMessage("Saving face data...");

    const res = await fetch("/api/face/enroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ embeddings }),
    });

    if (res.ok) {
      router.replace("/student/dashboard");
    } else {
      setMessage("❌ Failed to save face");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white bg-black">
      <h1 className="text-2xl mb-4">Face Registration</h1>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-72 rounded-xl border border-white/20 tranform scale-x-[-1]"
      />

      <button
        onClick={captureFace}
        disabled={capturing || embeddings.length >= 5}
        className="mt-4 px-6 py-2 bg-indigo-600 rounded disabled:opacity-40"
      >
        Capture Face
      </button>

      <button
        onClick={submitFace}
        disabled={embeddings.length < 5 || loading}
        className="mt-3 px-6 py-2 bg-green-600 rounded disabled:opacity-40"
      >
        Submit
      </button>

      <p className="mt-2 text-sm">{message}</p>
    </div>
  );
}