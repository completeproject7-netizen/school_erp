import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchMyFees, createFee } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader, StatusBadge } from "@/components/DataTable";
import { StatGrid } from "@/components/PageStub";
import { Wallet, CheckCircle2, AlertCircle, Receipt } from "lucide-react";

export const Route = createFileRoute("/my-fees")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["myFees"], queryFn: fetchMyFees });
  const feeMutation = useMutation({
    mutationFn: (payload: { studentId: string; amount: number; description: string }) => createFee({ ...payload, paymentMethod: "online" }),
    onSuccess: () => queryClient.invalidateQueries(["myFees"]),
  });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const fees = data?.fees ?? [];
  const outstanding = fees.filter((f) => !f.paymentMethod).reduce((a, f) => a + f.amount, 0);
  const paid = fees.filter((f) => f.paymentMethod).reduce((a, f) => a + f.amount, 0);

  const handlePayNow = () => {
    const amountText = window.prompt("Payment amount")?.trim();
    if (!amountText) return;
    const amount = Number(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert("Enter a valid amount.");
      return;
    }

    const description = window.prompt("Description")?.trim();
    if (!description) return;

    feeMutation.mutate({ studentId: user.id, amount, description });
  };

  return (
    <RoleDashboardLayout title="My Fees" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "My Fees" }]}> 
      <div className="space-y-6">
        <PageHeader title="My Fees" description="View invoices and pay online." />
        <StatGrid stats={[
          { label: "Outstanding", value: `$${outstanding.toLocaleString()}`, icon: AlertCircle, tone: "warning" },
          { label: "Paid (YTD)", value: `$${paid.toLocaleString()}`, icon: CheckCircle2, tone: "success" },
          { label: "Next Due", value: fees[0]?.paidAt ?? "TBD", icon: Wallet, tone: "primary" },
          { label: "Statements", value: String(fees.length), icon: Receipt, tone: "accent" },
        ]} />
        <DataTable
          title="Statements"
          rows={fees}
          primaryAction={{ label: "Pay Now", onClick: handlePayNow }}
          columns={[
            { key: "id", header: "Invoice" },
            { key: "amount", header: "Amount", render: (r) => `$${r.amount.toLocaleString()}` },
            { key: "paidAt", header: "Paid At" },
            { key: "paymentMethod", header: "Method", render: (r) => r.paymentMethod ?? "Pending" },
            { key: "description", header: "Description" },
          ]}
        />
      </div>
    </RoleDashboardLayout>
  );
}
