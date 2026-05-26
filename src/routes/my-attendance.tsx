import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchMyAttendance } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { PageHeader } from "@/components/DataTable";
import { StatGrid } from "@/components/PageStub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/DataTable";
import { CalendarCheck, CalendarX, Clock, Percent } from "lucide-react";

export const Route = createFileRoute("/my-attendance")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["myAttendance"], queryFn: fetchMyAttendance });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const attendance = data?.attendance ?? [];
  const present = attendance.filter((d) => d.status === "Present").length;
  const absent = attendance.filter((d) => d.status === "Absent").length;
  const late = attendance.filter((d) => d.status === "Late").length;
  const pct = attendance.length ? Math.round((present / attendance.length) * 100) : 0;

  return (
    <RoleDashboardLayout title="My Attendance" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "My Attendance" }]}> 
      <div className="space-y-6">
        <PageHeader title="My Attendance" description="Term 2 · 2026" />
        <StatGrid stats={[
          { label: "Attendance %", value: `${pct}%`, icon: Percent, tone: "success" },
          { label: "Present", value: String(present), icon: CalendarCheck, tone: "primary" },
          { label: "Absent", value: String(absent), icon: CalendarX, tone: "destructive" },
          { label: "Late", value: String(late), icon: Clock, tone: "warning" },
        ]} />
        <Card>
          <CardHeader><CardTitle>Recent Days</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {attendance.map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{new Date(d.date).toLocaleDateString()}</span>
                  <StatusBadge value={d.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </RoleDashboardLayout>
  );
}
