import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Analytics = {
  totals: { students: number; teachers: number; staff: number; courses?: number };
  fees: { totalCollected: number; totalPayments: number };
  studentTrend: Array<{ _id: string; count: number }>;
  events?: { approved?: number; pending?: number };
};

const COLORS = ["#4f46e5", "#06b6d4", "#f97316", "#10b981"];

export default function AnalyticsCharts({ analytics }: { analytics: Analytics | undefined }) {
  const [range, setRange] = useState<"7" | "30" | "all">("7");
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null);

  if (!analytics) return null;

  const { totals, fees, studentTrend } = analytics;

  const allTrend = useMemo(() => (studentTrend || []).map((t) => ({ date: t._id, count: t.count })), [studentTrend]);

  const trendData = useMemo(() => {
    if (range === "all") return allTrend;
    const days = Number(range);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days + 1);
    return allTrend.filter((d) => new Date(d.date) >= cutoff);
  }, [allTrend, range]);

  const totalsData = useMemo(
    () => [
      { name: "Students", value: totals.students },
      { name: "Teachers", value: totals.teachers },
      { name: "Staff", value: totals.staff },
      { name: "Courses", value: totals.courses || 0 },
    ],
    [totals],
  );

  const feeData = useMemo(() => [{ name: "Collected", value: fees.totalCollected }, { name: "Payments", value: fees.totalPayments }], [fees]);

  const handleSliceClick = (index: number) => {
    setSelectedSlice((s) => (s === index ? null : index));
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Student Enrollment Trend</h3>
          <div className="flex gap-2">
            <button className={`px-2 py-1 rounded ${range === "7" ? "bg-muted text-foreground" : "bg-transparent"}`} onClick={() => setRange("7")}>7d</button>
            <button className={`px-2 py-1 rounded ${range === "30" ? "bg-muted text-foreground" : "bg-transparent"}`} onClick={() => setRange("30")}>30d</button>
            <button className={`px-2 py-1 rounded ${range === "all" ? "bg-muted text-foreground" : "bg-transparent"}`} onClick={() => setRange("all")}>All</button>
          </div>
        </div>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={COLORS[0]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="p-4 rounded-lg border bg-card">
          <h3 className="text-sm font-medium mb-3">Institution Breakdown</h3>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={totalsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value">
                  {totalsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={selectedSlice === null ? 1 : selectedSlice === index ? 1 : 0.3} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex gap-2">
            {totalsData.map((t, i) => (
              <button key={t.name} onClick={() => handleSliceClick(i)} className={`flex items-center gap-2 px-2 py-1 rounded ${selectedSlice === i ? "bg-muted" : "bg-transparent"}`}>
                <span style={{ width: 12, height: 12, background: COLORS[i % COLORS.length], display: "inline-block", borderRadius: 3 }} />
                <span className="text-sm">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <h3 className="text-sm font-medium mb-3">Fee Summary</h3>
          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={feeData} dataKey="value" nameKey="name" innerRadius={36} outerRadius={56} paddingAngle={4}>
                  {feeData.map((entry, index) => (
                    <Cell key={`cell-fee-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-sm">
            <div className="flex justify-between"><span>Collected</span><strong>${fees.totalCollected.toLocaleString()}</strong></div>
            <div className="flex justify-between"><span>Payments</span><strong>{fees.totalPayments.toLocaleString()}</strong></div>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <h3 className="text-sm font-medium mb-3">Events & Announcements</h3>
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between"><span>Approved Events</span><strong>{analytics.events?.approved ?? "—"}</strong></div>
            <div className="flex justify-between"><span>Pending Requests</span><strong>{analytics.events?.pending ?? "—"}</strong></div>
            <div className="flex justify-between mt-2"><span>Announcements</span><strong>{(analytics as any).announcements ?? "—"}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
