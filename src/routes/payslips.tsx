import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchPayslips } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader, StatusBadge } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const Route = createFileRoute("/payslips")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["payslips"], queryFn: fetchPayslips });
  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  const payslips = data?.payslips ?? [];
  return (
    <RoleDashboardLayout title="Payslips" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Payslips" }]}>
      <div className="space-y-6">
        <PageHeader title="Payslips" description="View and download your monthly payslips." />
        <DataTable
          title="Pay History"
          rows={payslips}
          searchable={false}
          columns={[
            { key: "month", header: "Period", render: (r) => <span className="font-medium">{r.month}</span> },
            { key: "id", header: "Ref", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
            { key: "gross", header: "Gross", render: (r) => `$${r.gross.toLocaleString()}` },
            { key: "deductions", header: "Deductions", render: (r) => `$${r.deductions.toLocaleString()}` },
            { key: "net", header: "Net Pay", render: (r) => <span className="font-semibold">${r.net.toLocaleString()}</span> },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            { key: "actions", header: "", render: () => <Button size="sm" variant="outline"><Download className="size-4" />PDF</Button> },
          ]}
        />
      </div>
    </RoleDashboardLayout>
  );
}
