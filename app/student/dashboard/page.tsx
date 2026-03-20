"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const router = useRouter();
  const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  router.replace("/login");
};

  const [student, setStudent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [typedInsight, setTypedInsight] = useState("");
  const [fullInsight, setFullInsight] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role")
      : null;

  /* =========================
     PROTECT ROUTE + LOAD DATA
  ========================= */
  useEffect(() => {
    if (!token || role !== "student") {
      router.replace("/login");
      return;
    }

    Promise.all([
      fetch("/api/student/profile", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),

      fetch("/api/reports/my-attendance", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
    ])
      .then(([studentData, attendanceData]) => {
        setStudent(studentData);
        setAttendance(attendanceData);
      })
      .finally(() => setLoading(false));
  }, [router, token, role]);

  /* =========================
     FORCE FACE REGISTRATION
  ========================= */
  useEffect(() => {
    if (!student) return;
    if (student.faceVerified === false) {
      router.replace("/student/face-register");
    }
  }, [student, router]);

  /* =========================
     AI INSIGHT
  ========================= */
  useEffect(() => {
    if (!attendance) return;

    const total = Number(attendance.totalSessions) || 0;
    const attended = Number(attendance.attendedSessions) || 0;
    const percentage = Number(attendance.overallPercentage) || 0;

    const required = 75;

    let safeMiss = 0;

    if (percentage >= required && required > 0) {
      const maxAllowed = (attended * 100) / required;
      safeMiss = Math.max(0, Math.floor(maxAllowed - total));
    }

    let insight = "";

    if (percentage >= 85) {
      insight =
        "Elite consistency detected. Your academic rhythm is strong and stable.";
    } else if (percentage >= 75) {
      insight = `Safe zone. You can miss ${safeMiss} more classes safely. Maintain discipline.`;
    } else if (percentage >= 60) {
      insight =
        "Warning threshold approaching. Maintain strict attendance to avoid shortage.";
    } else {
      insight =
        "Critical shortage detected. Immediate recovery required to secure eligibility.";
    }

    setFullInsight(insight);
  }, [attendance]);

  /* =========================
     TYPEWRITER EFFECT
  ========================= */
  useEffect(() => {
  if (!fullInsight) return;

  setTypedInsight("");

  let index = 0;

  const interval = setInterval(() => {
    setTypedInsight(fullInsight.slice(0, index + 1));

    index++;

    if (index >= fullInsight.length) {
      clearInterval(interval);
    }
  }, 18);

  return () => clearInterval(interval);
}, [fullInsight]);

  if (loading) return null;
  if (!student || !attendance) return null;

  const percentage = Number(attendance.overallPercentage) || 0;

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (percentage / 100) * circumference;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-emerald-950 to-black text-white px-6 md:px-12 py-12">

      {/* HERO */}
      <div className="flex justify-end mb-6">
  <button
    onClick={logout}
    className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg font-semibold transition hover:scale-105"
  >
    Logout
  </button>
</div>
      <div className="grid md:grid-cols-2 gap-12 items-center mb-20">

        <div>
          <h1 className="text-4xl font-bold mb-2">
            Welcome, {student.name}
          </h1>

          <p className="text-emerald-400 mb-8">
            Division: {student.division?.name || "Not Assigned"}
          </p>

          <span
            className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              percentage >= 75
                ? "bg-emerald-500/20 text-emerald-400"
                : percentage >= 60
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {percentage >= 75
              ? "Safe Zone"
              : percentage >= 60
              ? "Warning Zone"
              : "Critical Shortage"}
          </span>
        </div>

        {/* CIRCLE */}
        <div className="flex justify-center">
          <div className="relative w-56 h-56">

            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 180 180"
            >
              <circle
                cx="90"
                cy="90"
                r={radius}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="90"
                cy="90"
                r={radius}
                stroke="#10b981"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">
                {percentage}%
              </span>
              <span className="text-emerald-400 text-sm mt-2">
                Overall Attendance
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* CENTER QUOTE */}
      <div className="flex justify-center mb-20">
        <div className="max-w-3xl text-center bg-emerald-500/5 border border-emerald-400/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl">
          <p className="text-emerald-400 text-sm mb-4 tracking-widest uppercase">
            Daily Academic Insight
          </p>

          <p className="text-2xl md:text-3xl font-light leading-relaxed text-white/90 min-h-[80px]">
            {typedInsight}
            <span className="animate-pulse">|</span>
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-8 mb-20">

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-white/60 text-sm">Total Classes</p>
          <h2 className="text-3xl font-bold mt-2">
            {attendance.totalSessions}
          </h2>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-white/60 text-sm">Classes Attended</p>
          <h2 className="text-3xl font-bold mt-2">
            {attendance.attendedSessions}
          </h2>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-white/60 text-sm">Attendance Percentage</p>
          <h2 className="text-3xl font-bold mt-2">
            {percentage}%
          </h2>
        </div>

      </div>

      {/* ACTIONS */}
      <div className="grid md:grid-cols-2 gap-6">

        <button
          onClick={() => router.push("/student/timetable")}
          className="bg-emerald-600 hover:bg-emerald-700 p-4 rounded-xl font-semibold transition hover:scale-105 shadow-lg"
        >
          View Timetable
        </button>


        <button
          onClick={() => router.push("/student/reports")}
          className="bg-emerald-600 hover:bg-emerald-700 p-4 rounded-xl font-semibold transition hover:scale- shadow-lg"
        >
          Reports
        </button>

      </div>
    </div>
  );
}