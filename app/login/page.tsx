"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [quoteIndex, setQuoteIndex] = useState(0);

  // ✅ NEW: particles state
  const [particles, setParticles] = useState<any[]>([]);

  const quotes = [
    "Consistency beats talent when talent fails to attend.",
    "Your attendance today builds your success tomorrow.",
    "Small daily discipline leads to extraordinary results.",
    "Education is built one class at a time.",
  ];

  /* QUOTE ROTATION */
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /* MOUSE GLOW */
  const handleMouseMove = (e: any) => {
    setMouse({ x: e.clientX, y: e.clientY });
  };

  /* ✅ GENERATE PARTICLES ONLY ON CLIENT */
  useEffect(() => {
    const arr = [...Array(25)].map(() => ({
      size: Math.random() * 6 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 3 + Math.random() * 5,
    }));

    setParticles(arr);
  }, []);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const login = async () => {
    setError("");

    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Enter a valid email");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      if (data.role === "admin") router.push("/admin/dashboard");
      else if (data.role === "teacher") router.push("/teacher/dashboard");
      else router.push("/student/dashboard");

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

      {/* MOUSE LIGHT EFFECT */}
      <div
        className="pointer-events-none absolute w-[500px] h-[500px] rounded-full blur-[140px] opacity-40"
        style={{
          left: mouse.x - 250,
          top: mouse.y - 250,
          background: "radial-gradient(circle, #10b981, transparent 70%)"
        }}
      />

      {/* LOGIN CARD */}
      <div className="w-[380px] bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative z-10">

        <h2 className="text-3xl font-bold text-center mb-6">
          Student Portal
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-black/40 border border-white/10 focus:outline-none focus:border-emerald-400"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-black/40 border border-white/10 focus:outline-none focus:border-emerald-400"
        />

        {error && (
          <p className="text-red-400 text-sm mb-3">{error}</p>
        )}

        <button
          onClick={login}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold transition hover:scale-[1.02]"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm mt-5 text-white/70">
          Don’t have an account?{" "}
          <span
            onClick={()=>router.push("/register")}
            className="text-emerald-400 cursor-pointer hover:underline"
          >
            Register
          </span>
        </p>

        {/* QUOTE */}
        <div className="mt-8 text-center text-white/70 italic text-sm min-h-[40px] transition-all">
          "{quotes[quoteIndex]}"
        </div>

      </div>

      {/* FLOATING PARTICLES */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p,i)=>(
          <div
            key={i}
            className="absolute bg-emerald-400/20 rounded-full animate-pulse"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDuration: `${p.duration}s`
            }}
          />
        ))}
      </div>

    </div>
  );
}