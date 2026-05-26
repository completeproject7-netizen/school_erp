import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchTasks } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader, StatusBadge } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/tasks")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["tasks"], queryFn: fetchTasks });
  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  const tasks = data?.tasks ?? [];
  return (
    <RoleDashboardLayout title="Tasks" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Tasks" }]}>
      <div className="space-y-6">
        <PageHeader title="My Tasks" description="Things to get done this week." />
        <DataTable
          title="Open Tasks"
          rows={tasks}
          primaryAction={{ label: "Add Task" }}
          columns={[
            { key: "title", header: "Task", render: (r) => <span className="font-medium">{r.title}</span> },
            { key: "assignee", header: "Assignee" },
            { key: "due", header: "Due" },
            { key: "priority", header: "Priority", render: (r) => (
              <Badge variant={r.priority === "High" ? "destructive" : r.priority === "Low" ? "secondary" : "outline"}>{r.priority}</Badge>
            )},
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
          ]}
        />
      </div>
    </RoleDashboardLayout>
  );
}
