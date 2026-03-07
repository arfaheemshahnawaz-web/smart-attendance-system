"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch("/api/reports/summary", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),

      fetch("/api/reports/subject-wise", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),

      fetch("/api/reports/monthly", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ]).then(([s, sub, mon]) => {
      setSummary(s);
      setSubjects(sub);
      setMonthly(mon);
    });
  }, [token]);

  if (!summary) return null;

  const downloadPDF = () => {
    if (!summary || !Array.isArray(subjects)) {
      alert("Report data is still loading.");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Student Attendance Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Total Sessions: ${summary.totalSessions}`, 14, 35);
    doc.text(`Attended Sessions: ${summary.attendedSessions}`, 14, 45);
    doc.text(`Attendance: ${summary.overallPercentage}%`, 14, 55);

    /* SUBJECT TABLE */

    const subjectRows = subjects.map((s) => [
      s.subject,
      s.total,
      s.attended,
      `${s.percentage}%`,
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["Subject", "Total", "Attended", "Percentage"]],
      body: subjectRows,
    });

    /* MONTHLY TABLE */

    const monthlyRows = Array.isArray(monthly)
      ? monthly.map((m) => [
          m.month,
          m.total,
          m.attended,
          `${m.percentage}%`,
        ])
      : [];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [["Month", "Total", "Attended", "Percentage"]],
      body: monthlyRows,
    });

    doc.save("attendance-report.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-emerald-950 to-black text-white px-10 py-12">

      <h1 className="text-4xl font-bold mb-10">
        Attendance Reports
      </h1>

      {/* SUMMARY */}

      <div className="grid md:grid-cols-3 gap-6 mb-16">

        <div className="bg-white/5 p-6 rounded-xl">
          <p>Total Classes</p>
          <h2 className="text-3xl font-bold">
            {summary.totalSessions}
          </h2>
        </div>

        <div className="bg-white/5 p-6 rounded-xl">
          <p>Attended</p>
          <h2 className="text-3xl font-bold">
            {summary.attendedSessions}
          </h2>
        </div>

        <div className="bg-white/5 p-6 rounded-xl">
          <p>Attendance</p>
          <h2 className="text-3xl font-bold">
            {summary.overallPercentage}%
          </h2>
        </div>

      </div>

      {/* REQUIRED CLASSES */}

      {summary.overallPercentage < 75 && (
        <div className="bg-red-500/10 border border-red-400/20 p-6 rounded-xl mb-16">
          You must attend{" "}
          <b>{summary.requiredClasses}</b> consecutive
          classes to reach 75%.
        </div>
      )}

      {/* SUBJECT TABLE */}

      <h2 className="text-2xl font-semibold mb-6">
        Subject Wise Report
      </h2>

      <table className="w-full mb-16">

        <thead className="bg-white/10">
          <tr>
            <th className="p-3">Subject</th>
            <th className="p-3">Total</th>
            <th className="p-3">Attended</th>
            <th className="p-3">%</th>
          </tr>
        </thead>

        <tbody>

          {Array.isArray(subjects) &&
            subjects.map((s, i) => (
              <tr key={i} className="border-t border-white/10">
                <td className="p-3">{s.subject}</td>
                <td className="p-3">{s.total}</td>
                <td className="p-3">{s.attended}</td>
                <td className="p-3">{s.percentage}%</td>
              </tr>
            ))}

        </tbody>
      </table>

      {/* MONTHLY */}

      <h2 className="text-2xl font-semibold mb-6">
        Monthly Trend
      </h2>

      <table className="w-full">

        <thead className="bg-white/10">
          <tr>
            <th className="p-3">Month</th>
            <th className="p-3">Total</th>
            <th className="p-3">Attended</th>
            <th className="p-3">%</th>
          </tr>
        </thead>

        <tbody>

          {Array.isArray(monthly) &&
            monthly.map((m, i) => (
              <tr key={i} className="border-t border-white/10">
                <td className="p-3">{m.month}</td>
                <td className="p-3">{m.total}</td>
                <td className="p-3">{m.attended}</td>
                <td className="p-3">{m.percentage}%</td>
              </tr>
            ))}

        </tbody>

      </table>

      {/* DOWNLOAD BUTTON */}

      <button
        onClick={downloadPDF}
        className="mt-10 bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg font-semibold shadow-lg"
      >
        Download PDF
      </button>

    </div>
  );
}