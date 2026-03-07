"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    collegeId: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [quoteIndex, setQuoteIndex] = useState(0);

  const quotes = [
    "Education begins with showing up.",
    "Discipline today creates success tomorrow.",
    "Great students build great habits.",
    "Attendance is the first step toward achievement.",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: any) => {
    setMouse({ x: e.clientX, y: e.clientY });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const register = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Registration failed");

      alert("Registration successful. Await admin approval.");
      router.push("/login");

    } catch (err:any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center justify-center overflow-hidden
      bg-gradient-to-br from-black via-emerald-950 to-black text-white"
    >

      {/* CURSOR GLOW */}
      <div
        className="pointer-events-none absolute w-[500px] h-[500px] rounded-full blur-[140px] opacity-40"
        style={{
          left: mouse.x - 250,
          top: mouse.y - 250,
          background: "radial-gradient(circle, #10b981, transparent 70%)",
        }}
      />

      {/* REGISTER CARD */}
      <div className="w-[380px] bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative z-10">

        <h2 className="text-3xl font-bold text-center mb-6">
          Create Account
        </h2>

        <input
          name="name"
          placeholder="Full Name"
          onChange={handleChange}
          className="w-full p-3 mb-4 rounded-lg bg-black/40 border border-white/10 focus:outline-none focus:border-emerald-400"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
          className="w-full p-3 mb-4 rounded-lg bg-black/40 border border-white/10 focus:outline-none focus:border-emerald-400"
        />

        <input
          name="collegeId"
          placeholder="College ID / Roll No"
          onChange={handleChange}
          className="w-full p-3 mb-4 rounded-lg bg-black/40 border border-white/10 focus:outline-none focus:border-emerald-400"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full p-3 mb-4 rounded-lg bg-black/40 border border-white/10 focus:outline-none focus:border-emerald-400"
        />

        <select
          name="role"
          onChange={handleChange}
          className="w-full p-3 mb-4 rounded-lg bg-black/40 border border-white/10 focus:outline-none focus:border-emerald-400"
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>

        {error && (
          <p className="text-red-400 text-sm mb-3">{error}</p>
        )}

        <button
          onClick={register}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold transition hover:scale-[1.02]"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-center text-sm mt-5 text-white/70">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-emerald-400 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>

        {/* QUOTE */}
        <div className="mt-8 text-center text-white/70 italic text-sm min-h-[40px]">
          "{quotes[quoteIndex]}"
        </div>

      </div>

      {/* FLOATING PARTICLES */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-emerald-400/20 rounded-full animate-pulse"
            style={{
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${3 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

    </div>
  );
}