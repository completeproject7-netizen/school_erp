import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchStaff, createStaff, deleteStaff } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader, StatusBadge } from "@/components/DataTable";
import { StatGrid } from "@/components/PageStub";
import { Button } from "@/components/ui/button";
import { Users, UserCog, Briefcase, BadgeCheck, Trash } from "lucide-react";

export const Route = createFileRoute("/staff")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "administrator";
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["staff"],
    queryFn: fetchStaff,
    enabled: !!user && isAdmin,
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => queryClient.invalidateQueries(["staff"]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStaff(id),
    onSuccess: () => queryClient.invalidateQueries(["staff"]),
  });

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) {
    return (
      <RoleDashboardLayout title="Staff & Teachers" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Staff & Teachers" }]}> 
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Administrator access is required to view the staff and teacher directory.
        </div>
      </RoleDashboardLayout>
    );
  }
  if (isLoading) return null;
  if (isError) {
    return (
      <RoleDashboardLayout title="Staff & Teachers" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Staff & Teachers" }]}> 
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          Unable to load staff: {(error as Error)?.message || "Unknown error"}
        </div>
      </RoleDashboardLayout>
    );
  }

  const staff = data?.staff ?? [];
  const teachers = staff.filter((s) => s.role === "teacher").length;
  const departments = new Set(staff.map((s) => s.meta?.department ?? "Administration")).size;

  const handleAdd = async () => {
    const name = window.prompt("Name:");
    if (!name) return;
    const email = window.prompt("Email:");
    if (!email) return;
    const password = window.prompt("Password (min 8 chars):");
    if (!password) return;
    const role = window.prompt("Role (teacher/staff/administrator/admission):", "staff") || "staff";
    try {
      await createMutation.mutateAsync({ name, email, password, role });
      window.alert("Staff user created");
    } catch (err: any) {
      window.alert(err?.message || "Failed to create staff user");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this staff user?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      window.alert("Staff user deleted");
    } catch (err: any) {
      window.alert(err?.message || "Failed to delete staff user");
    }
  };

  return (
    <RoleDashboardLayout title="Staff & Teachers" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Staff & Teachers" }]}> 
      <div className="space-y-6">
        <PageHeader title="Staff & Teachers" description="Manage faculty and operational staff." />
        <StatGrid stats={[
          { label: "Total Staff", value: String(staff.length), icon: Users, tone: "primary" },
          { label: "Teachers", value: String(teachers), icon: UserCog, tone: "accent" },
          { label: "Active", value: String(staff.length), icon: BadgeCheck, tone: "success" },
          { label: "Departments", value: String(departments), icon: Briefcase, tone: "warning" },
        ]} />
        <DataTable
          title="Faculty & Staff"
          description="All school employees"
          rows={staff}
          primaryAction={{ label: "Add Staff", onClick: handleAdd }}
          columns={[
            { key: "id", header: "ID" },
            { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "role", header: "Role" },
            { key: "department", header: "Department", render: (r) => r.meta?.department ?? "—" },
            { key: "email", header: "Email" },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.role} /> },
            {
              key: "action",
              header: "",
              render: (r) => (
                <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)} disabled={deleteMutation.isLoading}>
                  <Trash className="size-4" />
                </Button>
              ),
            },
          ]}
        />
      </div>
    </RoleDashboardLayout>
  );
}
