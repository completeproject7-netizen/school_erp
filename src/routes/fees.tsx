import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchFees, createFee } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader, StatusBadge } from "@/components/DataTable";
import { StatGrid } from "@/components/PageStub";
import { DollarSign, Wallet, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/fees")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["fees"], queryFn: fetchFees });
  const feeMutation = useMutation({
    mutationFn: createFee,
    onSuccess: () => queryClient.invalidateQueries(["fees"]),
  });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const fees = data?.fees ?? [];
  const collected = fees.filter((f) => f.paymentMethod).reduce((a, f) => a + f.amount, 0);
  const pending = fees.filter((f) => !f.paymentMethod).reduce((a, f) => a + f.amount, 0);

  const handleRecordPayment = () => {
    const studentId = window.prompt("Student ID (required)")?.trim();
    if (!studentId) return;

    const amountText = window.prompt("Amount paid")?.trim();
    if (!amountText) return;
    const amount = Number(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert("Enter a valid payment amount.");
      return;
    }

    const description = window.prompt("Description")?.trim();
    if (!description) return;

    const paymentMethod = window.prompt("Payment method (online/cash)", "cash")?.trim().toLowerCase();
    if (paymentMethod !== "cash" && paymentMethod !== "online") {
      window.alert("Payment method must be online or cash.");
      return;
    }

    feeMutation.mutate({ studentId, amount, description, paymentMethod: paymentMethod as "online" | "cash" });
  };

  return (
    <RoleDashboardLayout title="Fees" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Fees" }]}> 
      <div className="space-y-6">
        <PageHeader title="Fee Management" description="Track collections, dues and overdue payments." />
        <StatGrid stats={[
          { label: "Collected", value: `$${collected.toLocaleString()}`, icon: DollarSign, tone: "success" },
          { label: "Pending", value: `$${pending.toLocaleString()}`, icon: Wallet, tone: "warning" },
          { label: "Payments", value: String(fees.length), icon: CheckCircle2, tone: "primary" },
          { label: "Student Records", value: String(new Set(fees.map((f) => f.studentId)).size), icon: AlertTriangle, tone: "destructive" },
        ]} />
        <DataTable
          title="Fee Records"
          rows={fees}
          primaryAction={{ label: "Record Payment", onClick: handleRecordPayment }}
          columns={[
            { key: "id", header: "Receipt #" },
            { key: "studentId", header: "Student ID" },
            { key: "amount", header: "Amount", render: (r) => `$${r.amount.toLocaleString()}` },
            { key: "description", header: "Description" },
            { key: "paymentMethod", header: "Method", render: (r) => r.paymentMethod ?? "Pending" },
            { key: "paidAt", header: "Paid At" },
          ]}
        />
      </div>
    </RoleDashboardLayout>
  );
}
