import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchTimetable } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { PageHeader } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/timetable")({ component: Page });

const DAYS: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri")[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SLOTS = ["08:30", "10:00", "11:30", "13:30"];

function parseClassList(value?: string | null) {
  return String(value || "")
    .split(/[,&]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function Page() {
  const { user, loading } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const teacherClasses = user?.role === "teacher" ? parseClassList(user.meta?.classes) : [];
  const isTeacher = user?.role === "teacher";
  const teacherHasAssignedClasses = isTeacher && teacherClasses.length > 0;
  const { data, isLoading, isError, error } = useQuery({
    queryKey: isTeacher ? ["timetable", "teacher"] : ["timetable", selectedGrade],
    queryFn: () => (isTeacher ? fetchTimetable() : fetchTimetable(selectedGrade || undefined)),
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (!user || selectedGrade) return;

    if (user.role === "student") {
      const userClass = user.meta?.class || "";
      if (userClass) {
        setSelectedGrade(userClass);
      }
    }

    if (user.role === "teacher" && teacherClasses.length > 0) {
      setSelectedGrade(teacherClasses[0]!);
    }
  }, [user, selectedGrade, teacherClasses]);

  const timetable = data?.timetable ?? [];
  const allGrades = Array.from(new Set(timetable.map((item) => item.grade).filter(Boolean))).sort();
  const grades = isTeacher
    ? Array.from(new Set(timetable.filter((item) => item.teacher === user?.name).map((item) => item.grade).filter(Boolean))).sort()
    : allGrades;
  const availableGrades = teacherHasAssignedClasses
    ? teacherClasses.filter((grade) => grades.includes(grade))
    : grades.length
      ? grades
      : allGrades;

  useEffect(() => {
    if (availableGrades.length && !availableGrades.includes(selectedGrade)) {
      setSelectedGrade(availableGrades[0]!);
    }
  }, [availableGrades, selectedGrade]);

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const filteredTimetable = selectedGrade ? timetable.filter((s) => s.grade === selectedGrade) : timetable;
  const visibleTimetable = isTeacher ? filteredTimetable.filter((s) => s.teacher === user.name) : filteredTimetable;
  const find = (d: string, t: string) => visibleTimetable.find((s) => s.day === d && s.time === t);

  return (
    <RoleDashboardLayout title="Timetable" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Timetable" }]}>
      <div className="space-y-6">
        <PageHeader
          title="Weekly Timetable"
          description={teacherHasAssignedClasses
            ? `${selectedGrade || "No assigned class available"} · Term 2 · 2026 · Timetable is locked to your assigned class`
            : `${selectedGrade ? `${selectedGrade} · ` : "All classes · "}Term 2 · 2026`}
          actions={
            availableGrades.length && !teacherHasAssignedClasses ? (
              <div className="grid gap-1">
                <label className="text-sm font-medium text-muted-foreground" htmlFor="grade-select">Class</label>
                <select
                  id="grade-select"
                  value={selectedGrade}
                  onChange={(event) => setSelectedGrade(event.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  {availableGrades.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
            ) : teacherHasAssignedClasses ? (
              <div className="grid gap-1">
                <p className="text-sm font-medium text-muted-foreground">Assigned class</p>
                <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Assigned class</Badge>
                    <span className="font-medium">{selectedGrade || "No assigned class available"}</span>
                  </div>
                </div>
              </div>
            ) : null
          }
        />
        {teacherHasAssignedClasses && !selectedGrade ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Your account does not currently have a matching assigned class in the timetable data. Please contact an administrator to confirm your class assignment.
          </div>
        ) : null}
        <Card>
          <CardHeader><CardTitle>Mon – Fri</CardTitle></CardHeader>
          <CardContent>
            {isError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                Unable to load timetable: {(error as Error)?.message || "Unknown error"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-separate border-spacing-1">
                  <thead>
                  <tr>
                    <th className="text-left p-2 text-muted-foreground font-medium w-20">Time</th>
                    {DAYS.map((d) => <th key={d} className="text-left p-2 text-muted-foreground font-medium">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {SLOTS.map((t) => (
                    <tr key={t}>
                      <td className="p-2 text-xs font-mono text-muted-foreground">{t}</td>
                      {DAYS.map((d) => {
                        const s = find(d, t);
                        return (
                          <td key={d} className="p-2">
                            {s ? (
                              <div className="rounded-lg border bg-card p-2.5 hover:border-primary/40 transition-colors">
                                <p className="text-sm font-medium">{isTeacher ? s.grade : s.subject}</p>
                                <p className="text-xs text-muted-foreground">{isTeacher ? `${s.subject} · ${s.room}` : `${s.room} · ${s.teacher}`}</p>
                              </div>
                            ) : <div className="text-xs text-muted-foreground p-2.5">—</div>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </RoleDashboardLayout>
  );
}
