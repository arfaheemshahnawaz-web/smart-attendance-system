"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";

let faceapi: any;

type Step = "qr" | "face" | "done";

export default function StudentScanPage() {
    const router = useRouter();

  const [step, setStep] = useState<Step>("qr");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrPayload, setQrPayload] = useState<any>(null);
  const [qrStarted, setQrStarted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const qrRef = useRef<Html5Qrcode | null>(null);

  /* =========================
     INTERACTIVE BACKGROUND
  ========================= */
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  /* =========================
     LOAD FACE MODELS ONCE
  ========================= */
  useEffect(() => {
    const loadModels = async () => {
      faceapi = await import("@vladmandic/face-api");
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    };
    loadModels();
  }, []);

  /* =========================
     STOP CAMERA
  ========================= */
  const stopCamera = () => {
    if (!videoRef.current?.srcObject) return;
    const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
    tracks.forEach((t) => t.stop());
    videoRef.current!.srcObject = null;
  };

  /* =========================
     START SELFIE CAMERA
  ========================= */
  const startFaceCamera = async () => {
    if (videoRef.current?.srcObject) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  };

  /* =========================
     QR SCANNER (CAMERA ONLY)
  ========================= */
  useEffect(() => {
    if (step !== "qr" || !qrStarted) return;

    const qr = new Html5Qrcode("qr-reader");
    qrRef.current = qr;

    const startScanner = async () => {
      try {
        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            try {
              const data = JSON.parse(decodedText.trim());

              await qr.stop();
              qr.clear();
              qrRef.current = null;

              setQrPayload(data);
              setMessage("QR scanned. Verify your face.");
              setStep("face");
            } catch {
              setMessage("Invalid QR code");
            }
          },
          () => {
            // Required error callback (ignored)
          }
        );
      } catch {
        setMessage("Camera failed to start");
      }
    };

    startScanner();

    return () => {
      if (qrRef.current) {
        try {
          qrRef.current.stop();
          qrRef.current.clear();
        } catch {}
        qrRef.current = null;
      }
    };
  }, [step, qrStarted]);

  /* =========================
     VERIFY FACE + MARK
  ========================= */
  const verifyFaceAndMark = async () => {
    try {
      setLoading(true);
      setMessage("");

      await startFaceCamera();
      await new Promise((res) => setTimeout(res, 600));

      if (!videoRef.current) {
        setMessage("Camera not ready");
        setLoading(false);
        return;
      }

      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setMessage("No face detected");
        stopCamera();
        setLoading(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);

      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Please login again");
        setLoading(false);
        return;
      }

      /* ===== VERIFY FACE ===== */
      const verifyRes = await fetch("/api/face/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ descriptor }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.verified) {
        setMessage(
          `❌ Face mismatch. Distance: ${verifyData.distance?.toFixed(3)}`
        );
        stopCamera();
        setLoading(false);
        return;
      }

      /* ===== MARK ATTENDANCE ===== */
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const res = await fetch("/api/attendance/mark", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              sessionId: qrPayload.sessionId,
              qrToken: qrPayload.qrToken,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              wifiName: "COLLEGE_WIFI",
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            setMessage(data.error || "Attendance failed");
          } else {
            setMessage("✅ Attendance marked successfully");
setStep("done");
stopCamera();

setTimeout(() => {
  router.push("/student/dashboard");
}, 2000);
          }

          setLoading(false);
        },
        () => {
          setMessage("Location permission denied");
          setLoading(false);
        }
      );
    } catch (err) {
      console.error(err);
      setMessage("Face verification failed");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === "qr") stopCamera();
  }, [step]);

  /* =========================
     UI
  ========================= */
  return (
  <div
    className="min-h-screen flex items-center justify-center px-6 transition-all duration-300"
    style={{
      background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, #064e3b 0%, #022c22 40%, #000000 100%)`,
    }}
  >
    <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 space-y-6">

      {/* TITLE */}
      <h2 className="text-3xl font-bold text-center text-white">
        Smart Attendance
      </h2>

      {/* QR STEP */}
      {step === "qr" && (
        <div className="space-y-4 text-center">

          {!qrStarted ? (
            <button
              onClick={() => setQrStarted(true)}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition hover:scale-[1.02]"
            >
              Start QR Scanner
            </button>
          ) : (
            <>
              <div
                id="qr-reader"
                className="w-full aspect-square rounded-xl overflow-hidden border border-white/10"
              />

              <p className="text-sm text-white/60">
                Scan the attendance QR code
              </p>
            </>
          )}

        </div>
      )}

      {/* FACE STEP */}
      {step === "face" && (
        <div className="space-y-4 text-center">

          <div className="flex justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-64 rounded-xl shadow-lg transform scale-x-[-1] border border-white/10"
            />
          </div>

          <p className="text-xs text-white/60">
            Keep your face centered and well lit
          </p>

          <button
            onClick={verifyFaceAndMark}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition
            ${
              loading
                ? "bg-gray-500"
                : "bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02]"
            }`}
          >
            {loading ? "Processing..." : "Verify Face & Mark Attendance"}
          </button>

        </div>
      )}

      {/* SUCCESS */}
      {step === "done" && (
        <div className="bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 p-4 rounded-xl text-center font-semibold">
          {message}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {message && step !== "done" && (
        <div className="bg-red-500/10 border border-red-400/20 text-red-400 p-3 rounded-xl text-sm text-center">
          {message}
        </div>
      )}

    </div>
  </div>
);
}