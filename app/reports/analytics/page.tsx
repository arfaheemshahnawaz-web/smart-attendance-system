"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  Pie,
  Line,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

export default function AttendanceAnalyticsPage() {
  const [data, setData] = useState<any>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  useEffect(() => {
    fetch("/api/reports/analytics", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-white p-10">
      <h1 className="text-4xl font-bold mb-8">
        Attendance Analytics
      </h1>

      {/* Overall */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6">
          <h2 className="text-xl mb-4">
            Overall Attendance
          </h2>
          <Pie
            data={{
              labels: ["Present", "Absent"],
              datasets: [
                {
                  data: [
                    data.attendedSessions,
                    data.totalSessions -
                      data.attendedSessions,
                  ],
                  backgroundColor: [
                    "#22c55e",
                    "#ef4444",
                  ],
                },
              ],
            }}
          />
        </div>

        {/* Day-wise */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6">
          <h2 className="text-xl mb-4">
            Day-wise Attendance
          </h2>
          <Line
            data={{
              labels: data.dayWise.map((d: any) => d.day),
              datasets: [
                {
                  label: "Attendance Count",
                  data: data.dayWise.map(
                    (d: any) => d.count
                  ),
                  borderColor: "#6366f1",
                },
              ],
            }}
          />
        </div>
      </div>

      {/* Subject-wise */}
      <div className="mt-10 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6">
        <h2 className="text-xl mb-4">
          Subject-wise Attendance %
        </h2>
        <Bar
          data={{
            labels: data.subjectWise.map(
              (s: any) => s.subject
            ),
            datasets: [
              {
                label: "Attendance %",
                data: data.subjectWise.map(
                  (s: any) => s.percentage
                ),
                backgroundColor: "#22c55e",
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
