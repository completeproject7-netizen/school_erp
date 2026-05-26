import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchAnalytics } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { PageHeader } from "@/components/DataTable";
import { StatGrid } from "@/components/PageStub";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, GraduationCap, DollarSign, Building2 } from "lucide-react";

export const Route = createFileRoute("/analytics")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: fetchAnalytics });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const totals = data?.totals ?? { students: 0, teachers: 0, staff: 0, admissions: 0, courses: 0, assignments: 0 };
  const fees = data?.fees ?? { totalCollected: 0, totalPayments: 0 };
  const events = data?.events ?? { approved: 0, pending: 0 };
  const announcements = data?.announcements ?? 0;
  const studentTrend = data?.studentTrend ?? [];

  return (
    <RoleDashboardLayout title="Analytics" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Analytics" }]}> 
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Key metrics across the institution." />
        <StatGrid
          stats={[
            { label: "Total Students", value: String(totals.students), icon: GraduationCap, tone: "primary" },
            { label: "Total Teachers", value: String(totals.teachers), icon: TrendingUp, tone: "accent" },
            { label: "Fee Collection", value: `$${fees.totalCollected.toLocaleString()}`, icon: DollarSign, tone: "success" },
            { label: "Active Courses", value: String(totals.courses), icon: Building2, tone: "warning" },
          ]}
        />

        <AnalyticsCharts analytics={{ totals, fees, studentTrend }} />
      </div>
    </RoleDashboardLayout>
  );
}
