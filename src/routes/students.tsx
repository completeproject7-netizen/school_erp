import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchStudents, createStudent, deleteStudent } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader, StatusBadge } from "@/components/DataTable";
import { StatGrid } from "@/components/PageStub";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, UserCheck, BadgeAlert, Trash } from "lucide-react";

export const Route = createFileRoute("/students")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
    enabled: !!user,
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: () => queryClient.invalidateQueries(["students"]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => queryClient.invalidateQueries(["students"]),
  });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  if (isError) {
    return (
      <RoleDashboardLayout title="All Students" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Students" }]}> 
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          Unable to load students: {(error as Error)?.message || "Unknown error"}
        </div>
      </RoleDashboardLayout>
    );
  }

  const students = data?.students ?? [];
  const active = students.filter((s) => s.role === "student").length;
  const total = students.length;

  const handleAdd = async () => {
    const studentId = window.prompt("Student unique ID (leave blank for auto-generate):")?.trim();
    const name = window.prompt("Name:");
    if (!name) return;
    const email = window.prompt("Email:");
    if (!email) return;
    const password = window.prompt("Password (min 8 chars):");
    if (!password) return;
    const studentClass = window.prompt("Class / Grade (e.g. Grade 10A):")?.trim();
    try {
      await createMutation.mutateAsync({
        studentId: studentId || undefined,
        name,
        email,
        password,
        meta: studentClass ? { class: studentClass } : {},
      });
      window.alert("Student created");
    } catch (err: any) {
      window.alert(err?.message || "Failed to create student");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      window.alert("Student deleted");
    } catch (err: any) {
      window.alert(err?.message || "Failed to delete student");
    }
  };

  return (
    <RoleDashboardLayout title="All Students" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Students" }]}> 
      <div className="space-y-6">
        <PageHeader title="All Students" description="Manage student records, profiles and enrollment." />
        <StatGrid stats={[
          { label: "Total Students", value: String(total), icon: GraduationCap, tone: "primary" },
          { label: "Active", value: String(active), icon: UserCheck, tone: "success" },
          { label: "On Leave", value: "0", icon: BadgeAlert, tone: "warning" },
          { label: "Avg Attendance", value: "—", icon: Users, tone: "accent" },
        ]} />
        <DataTable
          title="Student Directory"
          description={`${total} enrolled students`}
          rows={students}
          primaryAction={{ label: "Add Student", onClick: handleAdd }}
          columns={[
            { key: "studentId", header: "Student ID" },
            { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "email", header: "Email" },
            { key: "role", header: "Role" },
            { key: "class", header: "Class", render: (r) => r.meta?.class ?? "—" },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.role ?? "student"} /> },
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
