"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useRouter } from "next/navigation";

export default function FaceRegistrationPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [descriptor, setDescriptor] = useState<Float32Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔐 Auth check
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;
  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role")
      : null;

  // 🔐 Protect route
  useEffect(() => {
    if (!token || role !== "student") {
      router.replace("/login");
    }
  }, [token, role, router]);

  // 🧠 Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

        setModelsLoaded(true);
      } catch (err) {
        setError("Failed to load face recognition models");
      }
    };

    loadModels();
  }, []);

  // 📸 Start camera
  useEffect(() => {
    if (!modelsLoaded) return;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setError("Camera access denied");
      });
  }, [modelsLoaded]);

  // 🧠 Detect face & extract descriptor
  const captureFace = async () => {
    if (!videoRef.current) return;

    setLoading(true);
    setError("");

    try {
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setFaceDetected(false);
        setDescriptor(null);
        setError("No face detected. Please try again.");
      } else {
        setFaceDetected(true);
        setDescriptor(detection.descriptor);
      }
    } catch {
      setError("Face detection failed");
    } finally {
      setLoading(false);
    }
  };

  // 💾 Register face
  const registerFace = async () => {
    if (!descriptor) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/student/face/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          descriptor: Array.from(descriptor),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      alert("Face registered successfully");
      router.push("/student/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
        color: "white",
        padding: "30px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
        Face Registration
      </h1>

      {!modelsLoaded && (
        <p style={{ color: "#cfd9df" }}>
          Loading face recognition models...
        </p>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width={320}
        height={240}
        style={{
          margin: "20px auto",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      />

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={captureFace}
          disabled={loading || !modelsLoaded}
          style={{
            padding: "12px 24px",
            borderRadius: "10px",
            border: "none",
            background: "#6366f1",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {loading ? "Processing..." : "Capture Face"}
        </button>
      </div>

      {faceDetected && (
        <>
          <p style={{ color: "#22c55e", marginTop: "15px" }}>
            Face detected successfully ✅
          </p>

          <button
            onClick={registerFace}
            disabled={loading}
            style={{
              marginTop: "15px",
              padding: "12px 24px",
              borderRadius: "10px",
              border: "none",
              background: "#22c55e",
              color: "black",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Register Face
          </button>
        </>
      )}

      {error && (
        <p style={{ color: "#f87171", marginTop: "15px" }}>
          {error}
        </p>
      )}
    </div>
  );
}
