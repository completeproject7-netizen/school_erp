import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchAttendance, fetchStudents, submitAttendance } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { PageHeader } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock } from "lucide-react";

export const Route = createFileRoute("/take-attendance")({ component: Page });

type S = "P" | "A" | "L";

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function normalizeAttendanceStatusForUi(status?: string | null): S {
  const normalized = status?.trim().toLowerCase();
  if (normalized === "present" || normalized === "p") return "P";
  if (normalized === "absent" || normalized === "a") return "A";
  if (normalized === "late" || normalized === "l") return "L";
  return "P";
}

function parseClassList(value?: string | null) {
  return String(value || "")
    .split(/[,&]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function Page() {
  const { user, loading } = useAuth();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
    enabled: !!user,
  });
  const [marks, setMarks] = useState<Record<string, S>>({});
  const attendanceStudents = data?.students.filter((s) => s.role === "student") ?? [];
  const getStudentClass = (student: { class?: string | null; meta?: { class?: string | null } }) => student.class || student.meta?.class || "Unassigned";
  const allClasses = Array.from(new Set(attendanceStudents.map((student) => getStudentClass(student)))).sort();
  const teacherClasses = user?.role === "teacher" ? parseClassList(user.meta?.classes) : [];
  const teacherHasAssignedClasses = user?.role === "teacher" && teacherClasses.length > 0;
  const classes = teacherHasAssignedClasses
    ? teacherClasses.filter((cls) => allClasses.includes(cls))
    : allClasses;
  const [selectedClass, setSelectedClass] = useState<string>(classes[0] ?? "");
  const [attendanceDate, setAttendanceDate] = useState<string>(formatDateInput(new Date()));
  const list = selectedClass
    ? attendanceStudents.filter((student) => getStudentClass(student) === selectedClass)
    : attendanceStudents;
  const listIds = list.map((s) => s.id).join(",");
  const { data: attendanceData, isLoading: attendanceLoading, refetch: refetchAttendance } = useQuery({
    queryKey: ["attendance", selectedClass, attendanceDate],
    queryFn: () => fetchAttendance({ grade: selectedClass, date: attendanceDate }),
    enabled: !!user && !!selectedClass && !!attendanceDate,
    retry: false,
  });
  const existingAttendance = attendanceData?.attendance ?? [];
  const attendanceExists = !attendanceLoading && existingAttendance.length > 0;

  useEffect(() => {
    if (classes.length && !classes.includes(selectedClass)) {
      setSelectedClass(classes[0]!);
    }
  }, [classes, selectedClass]);

  useEffect(() => {
    if (list.length === 0) return;

    setMarks((currentMarks) => {
      const defaultMarks = Object.fromEntries(
        list.map((s) => {
          const record = existingAttendance.find((record) => record.studentId === s.id);
          return [s.id, normalizeAttendanceStatusForUi(record?.status)] as [string, S];
        }),
      );

      const sameMarks =
        Object.keys(defaultMarks).length === Object.keys(currentMarks).length &&
        Object.entries(defaultMarks).every(([key, value]) => currentMarks[key] === value);

      return sameMarks ? currentMarks : defaultMarks;
    });
  }, [listIds, existingAttendance, list.length]);

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  if (isError) {
    return (
      <RoleDashboardLayout title="Take Attendance" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Take Attendance" }]}> 
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          Unable to load students for attendance: {(error as Error)?.message || "Unknown error"}
        </div>
      </RoleDashboardLayout>
    );
  }

  const present = Object.values(marks).filter((v) => v === "P").length;

  return (
    <RoleDashboardLayout title="Take Attendance" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Take Attendance" }]}> 
      <div className="space-y-6">
        <PageHeader
          title="Take Attendance"
          description={teacherHasAssignedClasses
            ? `${selectedClass || "No assigned class available"} · ${attendanceDate} · Attendance is locked to your assigned class`
            : `${selectedClass || "All classes"} · ${attendanceDate} · Take attendance by class`}
          actions={
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
              {!teacherHasAssignedClasses ? (
                <div className="grid gap-1">
                  <label className="text-sm font-medium text-muted-foreground" htmlFor="class-select">Class</label>
                  <select
                    id="class-select"
                    value={selectedClass}
                    onChange={(event) => setSelectedClass(event.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {classes.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid gap-1">
                  <p className="text-sm font-medium text-muted-foreground">Assigned class</p>
                  <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">Assigned class</Badge>
                      <span className="font-medium">{selectedClass || "No assigned class available"}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid gap-1">
                <label className="text-sm font-medium text-muted-foreground" htmlFor="attendance-date">Date</label>
                <input
                  id="attendance-date"
                  type="date"
                  value={attendanceDate}
                  onChange={(event) => setAttendanceDate(event.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <Button
                disabled={attendanceExists}
                onClick={() => {
                  const attendanceGrade = selectedClass || undefined;
                  Promise.all(list.map((student) => submitAttendance({
                    studentId: student.id,
                    status: marks[student.id] || "P",
                    grade: attendanceGrade,
                    date: attendanceDate,
                  })))
                    .then(() => {
                      window.alert("Attendance submitted for all students.");
                      refetchAttendance();
                    })
                    .catch((err) => window.alert(err.message));
                }}
              >
                Submit
              </Button>
            </div>
          }
        />
        {teacherHasAssignedClasses && !selectedClass ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Your account does not currently have an assigned class available in the student list. Please contact an administrator to verify your class assignment.
          </div>
        ) : null}
        {attendanceExists ? (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-foreground">
            Attendance for <strong>{selectedClass}</strong> on <strong>{attendanceDate}</strong> has already been submitted for today.
          </div>
        ) : null}
        <Card>
          <CardHeader><CardTitle>{present} of {list.length} present</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {list.map((s) => (
                <li key={s.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.id}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(["P", "A", "L"] as S[]).map((m) => {
                      const Icon = m === "P" ? Check : m === "A" ? X : Clock;
                      const active = marks[s.id] === m;
                      return (
                        <Button
                          key={m}
                          size="sm"
                          variant={active ? "default" : "outline"}
                          onClick={() => setMarks((p) => ({ ...p, [s.id]: m }))}
                        >
                          <Icon className="size-4" />
                          {m === "P" ? "Present" : m === "A" ? "Absent" : "Late"}
                        </Button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </RoleDashboardLayout>
  );
}
