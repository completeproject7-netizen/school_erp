import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth, type User } from "@/lib/auth";
import {
  fetchAnalytics,
  fetchAnnouncements,
  fetchApplications,
  fetchAttendanceSummary,
  fetchAssignments,
  fetchCourses,
  fetchEnrollments,
  fetchEvents,
  fetchInquiries,
  fetchMyAttendance,
  fetchMyFees,
  fetchStudents,
  fetchTimetable,
} from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { StatGrid } from "@/components/PageStub";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Users,
  UserCheck,
  BookOpen,
  ClipboardCheck,
  Wallet,
  FileText,
  CalendarDays,
  Building2,
  Receipt,
  ClipboardList,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

type AttendanceSummary = {
  summary?: Array<{ status: string; count: number }>;
};

type ActivityEvent = {
  title: string;
  date: string;
  time: string;
  venue: string;
  category?: string;
  status?: string;
};

function getAttendanceRate(summary?: AttendanceSummary["summary"]) {
  const counts = summary ?? [];
  const attended = counts
    .filter((item) => item.status === "present" || item.status === "late")
    .reduce((total, item) => total + item.count, 0);
  const total = counts.reduce((total, item) => total + item.count, 0);
  if (!total) return "0%";
  return `${Math.round((attended / total) * 100)}%`;
}

function getStudentClass(user: User | null) {
  return user?.meta?.class || user?.meta?.grade || "N/A";
}

function getRollNumber(user: User | null) {
  return user?.meta?.rollNumber || user?.meta?.roll || "—";
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function parseClassList(value?: string | null) {
  return String(value || "")
    .split(/[,&]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getTeacherClasses(user: User | null) {
  return parseClassList(user?.meta?.classes);
}

function getStudentClassName(user: User | null) {
  return user?.meta?.class || user?.meta?.grade || "";
}

function filterTeacherCourses(courses: Array<{ id: string; grade?: string | null; teacherName?: string | null }>, teacherClasses: string[], teacherName: string) {
  if (teacherClasses.length) {
    return courses.filter((course) => teacherClasses.includes(course.grade || ""));
  }

  return courses.filter((course) => course.teacherName === teacherName || !course.teacherName);
}

function Dashboard() {
  const { user, loading } = useAuth();

  const analyticsQuery = useQuery({ queryKey: ["analytics"], queryFn: fetchAnalytics });
  const applicationsQuery = useQuery({ queryKey: ["applications-dashboard"], queryFn: fetchApplications, enabled: !!user });
  const enrollmentsQuery = useQuery({ queryKey: ["enrollments-dashboard"], queryFn: fetchEnrollments, enabled: !!user && user.role === "admission" });
  const inquiriesQuery = useQuery({ queryKey: ["inquiries-dashboard"], queryFn: fetchInquiries, enabled: !!user && user.role === "admission" });
  const eventsQuery = useQuery({ queryKey: ["events-dashboard"], queryFn: fetchEvents, enabled: !!user });
  const announcementsQuery = useQuery({ queryKey: ["announcements-dashboard"], queryFn: fetchAnnouncements, enabled: !!user });
  const attendanceSummaryQuery = useQuery({ queryKey: ["attendance-summary-dashboard"], queryFn: fetchAttendanceSummary, enabled: !!user });
  const assignmentsQuery = useQuery({ queryKey: ["assignments-dashboard"], queryFn: fetchAssignments, enabled: !!user });
  const coursesQuery = useQuery({ queryKey: ["courses-dashboard"], queryFn: fetchCourses, enabled: !!user });
  const studentsQuery = useQuery({ queryKey: ["students-dashboard"], queryFn: fetchStudents, enabled: !!user && user.role === "teacher" });
  const timetableQuery = useQuery({
    queryKey: ["timetable-dashboard", user?.role, user?.meta?.class],
    queryFn: () => {
      if (!user) return fetchTimetable();
      if (user.role === "student" && user.meta?.class) {
        return fetchTimetable(user.meta.class);
      }
      return fetchTimetable();
    },
    enabled: !!user && (user.role === "student" || user.role === "teacher"),
  });
  const myAttendanceQuery = useQuery({ queryKey: ["my-attendance-dashboard"], queryFn: fetchMyAttendance, enabled: !!user && user.role === "student" });
  const myFeesQuery = useQuery({ queryKey: ["my-fees-dashboard"], queryFn: fetchMyFees, enabled: !!user && user.role === "student" });

  const isLoading = [
    analyticsQuery,
    applicationsQuery,
    enrollmentsQuery,
    inquiriesQuery,
    eventsQuery,
    announcementsQuery,
    attendanceSummaryQuery,
    assignmentsQuery,
    coursesQuery,
    studentsQuery,
    timetableQuery,
    myAttendanceQuery,
    myFeesQuery,
  ].some((query) => query.isLoading);

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const totals = analyticsQuery.data?.totals ?? { students: 0, teachers: 0, staff: 0, courses: 0 };
  const applications = applicationsQuery.data?.applications ?? [];
  const enrollments = enrollmentsQuery.data?.enrollments ?? [];
  const inquiries = inquiriesQuery.data?.inquiries ?? [];
  const events = eventsQuery.data?.events ?? [];
  const announcements = announcementsQuery.data?.announcements ?? [];
  const attendanceRate = getAttendanceRate(attendanceSummaryQuery.data?.summary);
  const assignments = assignmentsQuery.data?.assignments ?? [];
  const courses = coursesQuery.data?.courses ?? [];
  const students = studentsQuery.data?.students ?? [];
  const timetable = timetableQuery.data?.timetable ?? [];
  const myAttendance = myAttendanceQuery.data?.attendance ?? [];
  const myFees = myFeesQuery.data?.fees ?? [];
  const studentClass = getStudentClassName(user);
  const teacherClasses = getTeacherClasses(user);
  const teacherCourses = filterTeacherCourses(courses, teacherClasses, user.name);
  const teacherCourseIds = new Set(teacherCourses.map((course) => course.id));

  const scopedAssignments = user.role === "student"
    ? assignments.filter((assignment) => {
        const course = courses.find((item) => item.id === assignment.courseId);
        return course?.grade === studentClass;
      })
    : user.role === "teacher"
      ? assignments.filter((assignment) => assignment.createdBy === user.id || teacherCourseIds.has(assignment.courseId))
      : assignments;

  const scopedTimetable = user.role === "teacher"
    ? timetable.filter((item) => teacherClasses.length ? teacherClasses.includes(item.grade || "") : item.teacher === user.name)
    : timetable;

  const studentAttendanceRate = myAttendance.length
    ? Math.round((myAttendance.filter((record) => record.status === "Present" || record.status === "Late").length / myAttendance.length) * 100)
    : 0;

  const feesTotal = myFees.reduce((sum, fee) => sum + fee.amount, 0);

  return (
    <RoleDashboardLayout title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]}> 
      {user.role === "administrator" && (
        <AdminDashboard
          totals={totals}
          attendanceRate={attendanceRate}
          applications={applications}
          applicationsCount={applications.length}
          assignmentsCount={assignments.length}
          events={events}
          announcements={announcements}
        />
      )}
      {user.role === "teacher" && (
        <TeacherDashboard
          name={user.name}
          courses={teacherCourses}
          timetable={scopedTimetable}
          attendanceRate={attendanceRate}
          assignmentsCount={scopedAssignments.length}
          studentCount={students.length}
        />
      )}
      {user.role === "student" && (
        <StudentDashboard
          name={user.name}
          className={getStudentClass(user)}
          rollNumber={getRollNumber(user)}
          attendanceRate={studentAttendanceRate}
          assignments={scopedAssignments}
          feesTotal={feesTotal}
          events={events}
        />
      )}
      {user.role === "admission" && (
        <AdmissionDashboard
          applications={applications}
          enrollments={enrollments}
          inquiries={inquiries}
          events={events}
        />
      )}
      {user.role === "staff" && <StaffDashboard name={user.name} />}
    </RoleDashboardLayout>
  );
}

function AdminDashboard({
  totals,
  attendanceRate,
  applications,
  applicationsCount,
  assignmentsCount,
  events,
  announcements,
}: {
  totals: { students: number; teachers: number; staff: number; courses: number };
  attendanceRate: string;
  applications: Array<{ applicant: string; appliedFor: string; date: string }>;
  applicationsCount: number;
  assignmentsCount: number;
  events: ActivityEvent[];
  announcements: Array<{ title: string; body: string; postedAt: string }>;
}) {
  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Total Students", value: String(totals.students), hint: "Live from users collection", icon: GraduationCap, tone: "primary" },
          { label: "Total Staff", value: String(totals.staff), hint: "Teachers, admissions, and support roles", icon: Users, tone: "accent" },
          { label: "Attendance Rate", value: attendanceRate, hint: "Derived from attendance records", icon: UserCheck, tone: "warning" },
          { label: "Assignments", value: String(assignmentsCount), hint: "Current database records", icon: ClipboardCheck, tone: "success" },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity applications={applications} announcements={announcements} events={events} />
        <UpcomingEvents events={events} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Admissions Snapshot</CardTitle>
            <CardDescription>Applications recorded in the live database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{applicationsCount}</div>
            <p className="text-sm text-muted-foreground mt-1">Applications are being tracked directly from the admissions collection.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Course Coverage</CardTitle>
            <CardDescription>Available courses in the catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totals.courses}</div>
            <p className="text-sm text-muted-foreground mt-1">Courses are synced from the courses collection and used by assignments and timetable views.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TeacherDashboard({
  name,
  courses,
  timetable,
  attendanceRate,
  assignmentsCount,
  studentCount,
}: {
  name: string;
  courses: Array<{ title: string; grade?: string | null; teacherName?: string | null }>; 
  timetable: Array<{ day: string; time: string; subject: string; room: string; grade?: string; teacher: string }>;
  attendanceRate: string;
  assignmentsCount: number;
  studentCount: number;
}) {
  const todayCode = new Date().toLocaleDateString("en-US", { weekday: "short" });
  const todaysClasses = timetable.filter((item) => item.day === todayCode);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Welcome back, {name}</h2>
        <p className="text-muted-foreground text-sm">Here is the live view of your today’s classes and reporting.</p>
      </div>
      <StatGrid
        stats={[
          { label: "Classes Today", value: String(todaysClasses.length || 0), hint: todaysClasses[0] ? `${todaysClasses[0].subject} · ${todaysClasses[0].room}` : "No timetable entries yet", icon: BookOpen, tone: "primary" },
          { label: "Pending Grading", value: String(assignmentsCount), hint: "Assignments currently in the database", icon: ClipboardCheck, tone: "warning" },
          { label: "My Students", value: String(studentCount || 0), hint: "Pulled from the users collection", icon: GraduationCap, tone: "accent" },
          { label: "Avg. Attendance", value: attendanceRate, hint: "From live attendance records", icon: UserCheck, tone: "success" },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Timetable entries from the live timetable collection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No timetable entries are available for today.</p>
            ) : (
              todaysClasses.map((item) => (
                <div key={`${item.time}-${item.subject}`} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className="text-sm font-mono w-14 text-muted-foreground">{item.time}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.subject} — {item.grade || "General"}</p>
                    <p className="text-xs text-muted-foreground">{item.room}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Courses You Manage</CardTitle>
            <CardDescription>Courses currently stored in the database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No courses are linked to your profile yet.</p>
            ) : (
              courses.slice(0, 4).map((course) => (
                <div key={course.title} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.grade || "Grade not set"}</p>
                  </div>
                  <Badge variant="outline">{course.teacherName || "Teacher unavailable"}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentDashboard({
  name,
  className,
  rollNumber,
  attendanceRate,
  assignments,
  feesTotal,
  events,
}: {
  name: string;
  className: string;
  rollNumber: string;
  attendanceRate: number;
  assignments: Array<{ title: string; dueDate: string | null }>; 
  feesTotal: number;
  events: ActivityEvent[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Hi {name.split(" ")[0]} 👋</h2>
          <p className="text-muted-foreground text-sm">{className} · Roll {rollNumber}</p>
        </div>
        <Badge variant="secondary">Term 2 · 2026</Badge>
      </div>
      <StatGrid
        stats={[
          { label: "Attendance", value: `${attendanceRate}%`, hint: "Based on your latest attendance records", icon: UserCheck, tone: "success" },
          { label: "Upcoming Tasks", value: String(assignments.length), hint: "Assignments from the live collection", icon: FileText, tone: "warning" },
          { label: "Fees Logged", value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(feesTotal), hint: "Recorded in the fees collection", icon: Wallet, tone: "destructive" },
          { label: "Events", value: String(events.length), hint: "Upcoming events in the calendar", icon: CalendarDays, tone: "accent" },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
            <CardDescription>Assignments currently stored in the database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignments are available right now.</p>
            ) : (
              assignments.slice(0, 4).map((assignment) => (
                <div key={assignment.title} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{assignment.title}</p>
                    <p className="text-xs text-muted-foreground">{assignment.dueDate ? formatDateLabel(assignment.dueDate) : "No due date"}</p>
                  </div>
                  <Badge variant="outline">Due {assignment.dueDate ? formatDateLabel(assignment.dueDate) : "Soon"}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <UpcomingEvents events={events} />
      </div>
    </div>
  );
}

function AdmissionDashboard({
  applications,
  enrollments,
  inquiries,
  events,
}: {
  applications: Array<{ applicant: string; appliedFor: string; stage: string; date: string }>;
  enrollments: Array<{ applicant: string; enrollmentStatus: string }>;
  inquiries: Array<{ id: string; status: string }>;
  events: ActivityEvent[];
}) {
  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "New Applications", value: String(applications.length), hint: "From the database", icon: Building2, tone: "primary" },
          { label: "Pending Review", value: String(applications.filter((item) => item.stage !== "Confirmed" && item.stage !== "Approved").length), hint: "Needs action", icon: FileText, tone: "warning" },
          { label: "Inquiries", value: String(inquiries.length), hint: "Current inquiry records", icon: ClipboardList, tone: "accent" },
          { label: "Enrolled", value: String(enrollments.length), hint: "Confirmed enrollment records", icon: GraduationCap, tone: "success" },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latest Applications</CardTitle>
            <CardDescription>Live admissions records from the applications collection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications are available right now.</p>
            ) : (
              applications.slice(0, 4).map((application) => (
                <div key={application.applicant + application.date} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{application.applicant}</p>
                    <p className="text-xs text-muted-foreground">{application.appliedFor}</p>
                  </div>
                  <Badge variant="outline">{application.stage}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <RecentActivity applications={applications} announcements={[]} events={events} />
      </div>
    </div>
  );
}

function StaffDashboard({ name }: { name: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Welcome, {name.split(" ")[0]}</h2>
        <p className="text-muted-foreground text-sm">Your workplace at a glance.</p>
      </div>
      <StatGrid
        stats={[
          { label: "Tasks Today", value: "6", hint: "2 high priority", icon: ClipboardList, tone: "primary" },
          { label: "Leave Balance", value: "12 days", hint: "Annual remaining", icon: CalendarDays, tone: "accent" },
          { label: "Last Payslip", value: "$2,840", hint: "March 2026", icon: Receipt, tone: "success" },
          { label: "Notices", value: "3", hint: "Unread", icon: FileText, tone: "warning" },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { t: "Restock library returns", p: "High" },
              { t: "Process visitor logs", p: "Normal" },
              { t: "Inventory check — Lab B", p: "Normal" },
              { t: "Submit weekly report", p: "High" },
            ].map((x) => (
              <div key={x.t} className="flex items-center justify-between p-3 rounded-lg border">
                <p className="text-sm">{x.t}</p>
                <Badge variant={x.p === "High" ? "destructive" : "secondary"}>{x.p}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <UpcomingEvents events={[]} />
      </div>
    </div>
  );
}

function RecentActivity({
  applications,
  announcements,
  events,
}: {
  applications: Array<{ applicant: string; appliedFor: string; date: string }>;
  announcements: Array<{ title: string; body: string; postedAt: string }>;
  events: ActivityEvent[];
}) {
  const items = [
    ...applications.slice(0, 2).map((application) => ({
      title: "New application",
      detail: `${application.applicant} — ${application.appliedFor}`,
      time: formatRelative(application.date),
    })),
    ...announcements.slice(0, 2).map((announcement) => ({
      title: "Announcement posted",
      detail: announcement.title,
      time: formatRelative(announcement.postedAt),
    })),
    ...events.slice(0, 2).map((event) => ({
      title: event.category || "Event scheduled",
      detail: `${event.title} · ${event.venue}`,
      time: formatRelative(event.date),
    })),
  ].slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from the live collections</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity is available yet.</p>
        ) : (
          items.map((item) => (
            <div key={`${item.title}-${item.detail}`} className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/50">
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingEvents({ events }: { events: ActivityEvent[] }) {
  const upcoming = events.slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
        <CardDescription>School calendar highlights from the events collection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming events are available right now.</p>
        ) : (
          upcoming.map((event) => (
            <div key={`${event.title}-${event.date}`} className="flex items-start justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.venue}</p>
              </div>
              <Badge variant="outline">{formatDateLabel(event.date)}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
