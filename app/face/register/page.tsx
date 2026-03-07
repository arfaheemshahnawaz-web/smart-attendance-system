"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useRouter } from "next/navigation";

export default function FaceRegisterPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : null;

  // 🔐 Only students allowed
  useEffect(() => {
    if (!token || role !== "student") {
      router.replace("/login");
    }
  }, [router, token, role]);

  // 📦 Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    };

    loadModels();
  }, []);

  // 🎥 Start camera
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
  }, []);

  // 📸 Capture & register face
  const registerFace = async () => {
    if (!videoRef.current) return;

    setLoading(true);
    setMessage("");

    const detection = await faceapi
      .detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setLoading(false);
      setMessage("❌ Face not detected. Try again.");
      return;
    }

    const descriptor = Array.from(detection.descriptor);

    try {
      const res = await fetch("/api/face/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ descriptor }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMessage("✅ Face registered successfully");
      setTimeout(() => router.push("/student/dashboard"), 1500);
    } catch (err: any) {
      setMessage(err.message || "Registration failed");
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
      }}
    >
      <div
        style={{
          width: "380px",
          padding: "30px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.2)",
          textAlign: "center",
        }}
      >
        <h2>Face Registration</h2>

        <video
          ref={videoRef}
          autoPlay
          muted
          width="100%"
          style={{ borderRadius: "12px", marginTop: "15px" }}
        />

        <button
          onClick={registerFace}
          disabled={loading}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            background: "#22c55e",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {loading ? "Registering..." : "Register Face"}
        </button>

        {message && (
          <p style={{ marginTop: "15px", fontWeight: 600 }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
