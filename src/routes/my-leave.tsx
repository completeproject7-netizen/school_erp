import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchLeaves } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader, StatusBadge } from "@/components/DataTable";
import { StatGrid } from "@/components/PageStub";
import { CalendarDays, CheckCircle2, Clock, Plane } from "lucide-react";

export const Route = createFileRoute("/my-leave")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["leaves"], queryFn: fetchLeaves });
  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  const leaves = data?.leaves ?? [];
  return (
    <RoleDashboardLayout title="Leave" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Leave" }]}>
      <div className="space-y-6">
        <PageHeader title="Leave" description="Request and track time off." />
        <StatGrid stats={[
          { label: "Annual Balance", value: "12 days", icon: CalendarDays, tone: "primary" },
          { label: "Sick Leave", value: "8 days", icon: Plane, tone: "accent" },
          { label: "Approved (YTD)", value: "9", icon: CheckCircle2, tone: "success" },
          { label: "Pending", value: "2", icon: Clock, tone: "warning" },
        ]} />
        <DataTable
          title="Leave History"
          rows={leaves}
          primaryAction={{ label: "New Request" }}
          columns={[
            { key: "id", header: "Ref" },
            { key: "type", header: "Type" },
            { key: "from", header: "From" },
            { key: "to", header: "To" },
            { key: "days", header: "Days" },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
          ]}
        />
      </div>
    </RoleDashboardLayout>
  );
}
