import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchAuditLogs } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader } from "@/components/DataTable";

export const Route = createFileRoute("/audit")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["auditLogs"], queryFn: fetchAuditLogs });
  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  const auditLogs = data?.audit ?? [];

  return (
    <RoleDashboardLayout title="Audit Logs" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Audit Logs" }]}>
      <div className="space-y-6">
        <PageHeader title="Audit Logs" description="System activity and security events." />
        <DataTable
          title="Recent Activity"
          rows={auditLogs}
          searchable
          columns={[
            { key: "at", header: "When" },
            { key: "actor", header: "Actor", render: (r) => <span className="font-medium">{r.actor}</span> },
            { key: "action", header: "Action" },
            { key: "target", header: "Target", render: (r) => <span className="font-mono text-xs">{r.target}</span> },
            { key: "ip", header: "IP" },
          ]}
        />
      </div>
    </RoleDashboardLayout>
  );
}
