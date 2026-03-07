"use client";

import { useState } from "react";

export default function AttendanceReportsPage() {
  const [className, setClassName] = useState("");
  const [date, setDate] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const fetchReport = async () => {
    if (!className) {
      alert("Enter class name");
      return;
    }

    setLoading(true);

    let url = `/api/reports/attendance?className=${className}`;
    if (date) url += `&date=${date}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();
    setData(result);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-white p-10">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">
          Attendance Reports
        </h1>
        <p className="text-white/70">
          Session-wise attendance overview
        </p>
      </div>

      {/* Filters */}
      <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6 mb-10 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder="Class Name (e.g. MCA S4)"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/60 outline-none"
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg p-3 text-white outline-none"
          />

          <button
            onClick={fetchReport}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 transition rounded-lg p-3 font-semibold"
          >
            {loading ? "Loading..." : "Fetch Report"}
          </button>
        </div>
      </div>

      {/* Results */}
      {data?.sessions?.length > 0 && (
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">
            Attendance Sessions
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-white/70">
                  <th className="p-3">Date</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Teacher</th>
                  <th className="p-3">Present Count</th>
                </tr>
              </thead>

              <tbody>
                {data.sessions.map((s: any) => {
                  const presentCount = data.attendance.filter(
                    (a: any) => a.sessionId._id === s._id
                  ).length;

                  return (
                    <tr
                      key={s._id}
                      className="border-t border-white/10 hover:bg-white/5"
                    >
                      <td className="p-3">
                        {new Date(s.startTime).toLocaleDateString()}
                      </td>
                      <td className="p-3">{s.subject}</td>
                      <td className="p-3">
                        {s.teacherId?.name}
                      </td>
                      <td className="p-3 font-semibold">
                        {presentCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
