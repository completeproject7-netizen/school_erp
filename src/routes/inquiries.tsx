import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchInquiries, updateInquiry } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader, StatusBadge } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/inquiries")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["inquiries"],
    queryFn: fetchInquiries,
    enabled: !loading && Boolean(user),
    onError: (err: any) => {
      toast.error(err?.message || "Failed to load inquiries");
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => updateInquiry(id, { status: "Approved" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Inquiry approved and moved to applications");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to approve inquiry"),
  });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  const inquiries = data?.inquiries ?? [];
  return (
    <RoleDashboardLayout title="Inquiries" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Inquiries" }]}>
      <div className="space-y-6">
        <PageHeader title="Parent Inquiries" description="Convert leads into applications." />
        <DataTable
          title="Recent Inquiries"
          rows={inquiries}
          columns={[
            { key: "id", header: "Ref" },
            { key: "parent", header: "Parent", render: (r) => <span className="font-medium">{r.parent}</span> },
            { key: "email", header: "Email" },
            { key: "phone", header: "Phone" },
            { key: "interestedIn", header: "Interested In" },
            { key: "receivedOn", header: "Received" },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            {
              key: "actions",
              header: "",
              render: (r) => (
                <Button
                  size="sm"
                  variant={r.status === "Approved" ? "outline" : "secondary"}
                  onClick={() => approveMutation.mutate(r.id)}
                  disabled={r.status === "Approved" || approveMutation.status === "pending"}
                >
                  <CheckCircle2 className="size-4" />
                  {r.status === "Approved" ? "Approved" : "Approve"}
                </Button>
              ),
            },
          ]}
        />
      </div>
    </RoleDashboardLayout>
  );
}
