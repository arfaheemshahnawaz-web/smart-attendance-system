"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AttendanceHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    if (!token) return;

    fetch("/api/student/history", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data);
          setFiltered(data);
        } else {
          console.error("Unexpected response:", data);
          setHistory([]);
          setFiltered([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setHistory([]);
        setFiltered([]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  /* ================= APPLY FILTERS ================= */
  useEffect(() => {
    let temp = [...history];

    if (subjectFilter !== "All") {
      temp = temp.filter(
        (h) => h.subject && h.subject === subjectFilter
      );
    }

    if (search) {
      temp = temp.filter(
        (h) =>
          h.subject &&
          h.subject.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(temp);
  }, [search, subjectFilter, history]);

  /* ================= SUBJECT OPTIONS ================= */
  const subjects = useMemo(() => {
    if (!Array.isArray(history) || history.length === 0)
      return ["All"];

    const unique = [
      ...new Set(
        history
          .filter((h) => h.subject)
          .map((h) => h.subject)
      ),
    ];

    return ["All", ...unique];
  }, [history]);

  /* ================= TREND DATA ================= */
  const trendData = useMemo(() => {
    if (!Array.isArray(history) || history.length === 0)
      return [];

    const grouped: Record<string, number> = {};

    history.forEach((item) => {
      if (!item.date) return;

      if (!grouped[item.date]) grouped[item.date] = 0;

      if (item.status === "present") {
        grouped[item.date] += 1;
      }
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, attended]) => ({
        date,
        attended,
      }));
  }, [history]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-emerald-950 to-black text-white px-6 md:px-12 py-12">

      <h1 className="text-3xl font-bold mb-10">
        Attendance History
      </h1>

      {/* ================= FILTER BAR ================= */}
      <div className="flex flex-col md:flex-row gap-4 mb-12">

        <input
          placeholder="Search by subject..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none focus:border-emerald-400 transition w-full md:w-1/2"
        />

        <button
          onClick={() => setSearch(searchInput)}
          className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-xl font-semibold transition"
        >
          Search
        </button>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none focus:border-emerald-400 transition"
        >
          {subjects.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      {/* ================= TREND GRAPH ================= */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-16 backdrop-blur-xl">
        <h2 className="text-lg font-semibold mb-6">
          Attendance Trend
        </h2>

        {trendData.length === 0 ? (
          <div className="text-white/50 text-center py-10">
            No attendance data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="attended"
                stroke="#10b981"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ================= LIST ================= */}
      {filtered.length === 0 ? (
        <div className="text-white/50 text-center mt-10">
          No records found.
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition"
            >
              <div className="flex justify-between items-center">

                <div>
                  <p className="text-emerald-400 font-medium">
                    {item.subject || "Unknown Subject"}
                  </p>
                  <p className="text-sm text-white/60">
                    {item.day} • {item.date} • {item.hourSlot}
                  </p>
                </div>

                <div
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    item.status === "present"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {item.status === "present"
                    ? "Present"
                    : "Rejected"}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
      

    </div>
  );
}