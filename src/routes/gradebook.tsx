import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchGradebook, updateGradebookEntry } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader } from "@/components/DataTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/gradebook")({ component: Page });

function parseClassList(value?: string | null) {
  return String(value || "")
    .split(/[,&]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function Page() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const teacherAssignedClasses = user?.role === "teacher" ? parseClassList(user.meta?.classes) : [];
  const teacherHasAssignedClasses = teacherAssignedClasses.length > 0;
  const { data, isLoading } = useQuery({
    queryKey: ["gradebook"],
    queryFn: fetchGradebook,
    enabled: !!user,
  });
  const [rows, setRows] = useState<Array<any>>([]);

  useEffect(() => {
    if (data?.gradebook) {
      setRows(data.gradebook.map((row) => ({ ...row })));
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: updateGradebookEntry,
    onSuccess: () => {
      queryClient.invalidateQueries(["gradebook"]);
    },
  });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const handleScoreChange = (id: string, field: string, value: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const numeric = Number(value);
        const updated = { ...row, [field]: Number.isNaN(numeric) ? 0 : numeric };
        const percent = Math.round((updated.quiz1 + updated.midterm + updated.project + updated.final) / 4);
        updated.percent = percent;
        updated.grade = percent >= 90 ? "A-" : percent >= 80 ? "B" : percent >= 70 ? "C" : percent >= 60 ? "D" : "F";
        updated.gpa = Number((Math.min(Math.max(percent, 0), 100) / 25).toFixed(2));
        return updated;
      }),
    );
  };

  const handleSave = (row: any) => {
    mutation.mutate({
      id: row.id,
      quiz1: row.quiz1,
      midterm: row.midterm,
      project: row.project,
      final: row.final,
      name: row.name,
      studentEmail: row.studentEmail,
    });
  };

  return (
    <RoleDashboardLayout title="Gradebook" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Gradebook" }]}> 
      <div className="space-y-6">
        <PageHeader
          title={teacherHasAssignedClasses ? `Gradebook — ${teacherAssignedClasses.join(", ")}` : "Gradebook"}
          description={teacherHasAssignedClasses
            ? "Only students in your assigned classes are available for grading."
            : "Enter and review scores for the current term."}
        />
        {teacherHasAssignedClasses && rows.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            No students are currently available in your assigned classes for grading.
          </div>
        ) : null}
        <DataTable
          title="Scores"
          rows={rows}
          primaryAction={{ label: "Add Assessment" }}
          columns={[
            { key: "name", header: "Student", render: (r) => <span className="font-medium">{r.name}</span> },
            {
              key: "quiz1",
              header: "Quiz 1 /100",
              render: (r) => (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={String(r.quiz1 ?? 0)}
                  onChange={(event) => handleScoreChange(r.id, "quiz1", event.target.value)}
                />
              ),
            },
            {
              key: "midterm",
              header: "Mid /100",
              render: (r) => (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={String(r.midterm ?? 0)}
                  onChange={(event) => handleScoreChange(r.id, "midterm", event.target.value)}
                />
              ),
            },
            {
              key: "project",
              header: "Project /100",
              render: (r) => (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={String(r.project ?? 0)}
                  onChange={(event) => handleScoreChange(r.id, "project", event.target.value)}
                />
              ),
            },
            {
              key: "final",
              header: "Final /100",
              render: (r) => (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={String(r.final ?? 0)}
                  onChange={(event) => handleScoreChange(r.id, "final", event.target.value)}
                />
              ),
            },
            { key: "percent", header: "Percent", render: (r) => <span>{r.percent ?? 0}%</span> },
            { key: "grade", header: "Grade", render: (r) => <span>{r.grade}</span> },
            {
              key: "action",
              header: "",
              render: (r) => (
                <Button size="sm" onClick={() => handleSave(r)} disabled={mutation.isLoading}>
                  Save
                </Button>
              ),
            },
          ]}
        />
      </div>
    </RoleDashboardLayout>
  );
}

