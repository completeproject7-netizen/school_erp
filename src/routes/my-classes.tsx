import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { fetchTimetable } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader } from "@/components/DataTable";

export const Route = createFileRoute("/my-classes")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["timetable", "teacher", user?.name],
    queryFn: fetchTimetable,
    enabled: !!user && user.role === "teacher",
  });
  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  const timetable = data?.timetable ?? [];
  const mine = timetable
    .filter((item) => item.teacher === user.name)
    .map((item, index) => ({
      id: `${item.day}-${item.time}-${item.grade}-${item.subject}-${index}`,
      day: item.day,
      time: item.time,
      grade: item.grade || "Unknown",
      subject: item.subject,
      room: item.room,
    }));
  return (
    <RoleDashboardLayout title="My Classes" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "My Classes" }]}>
      <div className="space-y-6">
        <PageHeader title="My Classes" description="Your teaching schedule synced with the student timetable." />
        <DataTable
          title="My Schedule"
          rows={mine}
          columns={[
            { key: "subject", header: "Subject", render: (r) => <span className="font-medium">{r.subject}</span> },
            { key: "grade", header: "Class" },
            { key: "day", header: "Day" },
            { key: "time", header: "Time" },
            { key: "room", header: "Room" },
          ]}
          emptyText="No scheduled classes found for your timetable."
        />
      </div>
    </RoleDashboardLayout>
  );
}
