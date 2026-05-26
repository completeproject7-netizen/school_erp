import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchMyGrades } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader } from "@/components/DataTable";
import { StatGrid } from "@/components/PageStub";
import { Award, TrendingUp, BookOpen, Sigma } from "lucide-react";

export const Route = createFileRoute("/my-grades")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["myGrades"], queryFn: fetchMyGrades });
  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  const grades = data?.grades ?? [];
  const avg = grades.length ? Math.round(grades.reduce((a, g) => a + g.percent, 0) / grades.length) : 0;
  return (
    <RoleDashboardLayout title="My Grades" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "My Grades" }]}>
      <div className="space-y-6">
        <PageHeader title="My Grades" description="Term 2 · 2026" />
        <StatGrid stats={[
          { label: "Overall Grade", value: "A-", icon: Award, tone: "primary" },
          { label: "GPA", value: "3.8 / 4.0", icon: Sigma, tone: "accent" },
          { label: "Average %", value: `${avg}%`, icon: TrendingUp, tone: "success" },
          { label: "Courses", value: String(grades.length), icon: BookOpen, tone: "warning" },
        ]} />
        <DataTable
          title="Per-Course Grades"
          rows={grades.map((g, i) => ({ ...g, id: String(i) }))}
          searchable={false}
          columns={[
            { key: "course", header: "Course", render: (r) => <span className="font-medium">{r.course}</span> },
            { key: "teacher", header: "Teacher" },
            { key: "percent", header: "Score", render: (r) => `${r.percent}%` },
            { key: "grade", header: "Grade", render: (r) => <span className="font-semibold">{r.grade}</span> },
            { key: "trend", header: "Trend", render: (r) => r.trend === "up" ? "↑ Improving" : r.trend === "down" ? "↓ Slipping" : "→ Steady" },
          ]}
        />
      </div>
    </RoleDashboardLayout>
  );
}
