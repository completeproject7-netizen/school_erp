import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchCourses, createCourse, deleteCourse } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader } from "@/components/DataTable";
import { StatGrid } from "@/components/PageStub";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, GraduationCap, Users, Layers, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/academics")({ component: Page });

const gradeOptions = Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`);
const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const emptyCourseForm = {
  title: "",
  description: "",
  grade: "",
  teacherName: "",
  credits: "3",
  days: [] as string[],
  time: "",
  room: "",
};

function Page() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["courses"], queryFn: fetchCourses });
  const [open, setOpen] = useState(false);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);

  const courseMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries(["courses"]);
      setOpen(false);
      setCourseForm(emptyCourseForm);
      toast.success("Course created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create course"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries(["courses"]);
      toast.success("Course deleted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete course"),
  });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const courses = data?.courses ?? [];

  const handleCreateCourse = (event: React.FormEvent) => {
    event.preventDefault();

    if (!courseForm.title.trim() || !courseForm.description.trim() || !courseForm.grade.trim()) {
      toast.error("Title, description, and class/grade are required");
      return;
    }

    if (!gradeOptions.includes(courseForm.grade)) {
      toast.error("Grade must be between Grade 1 and Grade 12");
      return;
    }

    const credits = Number(courseForm.credits);
    if (!Number.isFinite(credits) || credits < 1 || credits > 10) {
      toast.error("Credits must be between 1 and 10");
      return;
    }

    courseMutation.mutate({
      title: courseForm.title.trim(),
      description: courseForm.description.trim(),
      grade: courseForm.grade.trim(),
      teacherName: courseForm.teacherName.trim() || undefined,
      credits,
      day: courseForm.days.length > 0 ? courseForm.days.join(", ") : undefined,
      time: courseForm.time.trim() || undefined,
      room: courseForm.room.trim() || undefined,
    });
  };

  return (
    <RoleDashboardLayout title="Academics" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Academics" }]}> 
      <div className="space-y-6">
        <PageHeader title="Academics" description="Curriculum, courses and class management." />
        <StatGrid stats={[
          { label: "Active Courses", value: String(courses.length), icon: BookOpen, tone: "primary" },
          { label: "Total Enrolments", value: "—", icon: GraduationCap, tone: "accent" },
          { label: "Avg Class Size", value: "—", icon: Users, tone: "success" },
          { label: "Grades Offered", value: String(new Set(courses.map((c) => c.grade)).size), icon: Layers, tone: "warning" },
        ]} />
        <Dialog open={open} onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setCourseForm(emptyCourseForm);
          }
        }}>
          <DataTable
            title="Course Catalog"
            description="All courses for the current term"
            rows={courses}
            primaryAction={{ label: "New Course", onClick: () => setOpen(true) }}
            columns={[
              { key: "id", header: "ID" },
              { key: "title", header: "Title", render: (r) => <span className="font-medium">{r.title}</span> },
              { key: "description", header: "Description" },
              { key: "grade", header: "Class" },
              { key: "teacherName", header: "Instructor" },
              { key: "credits", header: "Credits" },
              { key: "createdAt", header: "Created" },
              {
                key: "actions",
                header: "Actions",
                render: (r) => (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const confirmed = window.confirm(`Delete course "${r.title}"?`);
                      if (!confirmed) return;
                      deleteMutation.mutate(r.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                ),
              },
            ]}
          />
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Course</DialogTitle>
              <DialogDescription>Add a course with the details for this term.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="course-title">Course title</Label>
                  <Input
                    id="course-title"
                    value={courseForm.title}
                    onChange={(event) => setCourseForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="e.g. Algebra II"
                    required
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="course-description">Description</Label>
                  <Input
                    id="course-description"
                    value={courseForm.description}
                    onChange={(event) => setCourseForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="What students will learn in this course"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="course-grade">Class / Grade</Label>
                  <select
                    id="course-grade"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={courseForm.grade}
                    onChange={(event) => setCourseForm((current) => ({ ...current, grade: event.target.value }))}
                    required
                  >
                    <option value="" disabled>
                      Select grade
                    </option>
                    {gradeOptions.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="course-credits">Credits</Label>
                  <Input
                    id="course-credits"
                    type="number"
                    min={1}
                    max={10}
                    value={courseForm.credits}
                    onChange={(event) => setCourseForm((current) => ({ ...current, credits: event.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="course-teacher">Instructor</Label>
                  <Input
                    id="course-teacher"
                    value={courseForm.teacherName}
                    onChange={(event) => setCourseForm((current) => ({ ...current, teacherName: event.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label>Days</Label>
                  <p className="text-sm text-muted-foreground">Choose one or more days of the week.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {weekDays.map((day) => {
                      const checked = courseForm.days.includes(day);

                      return (
                        <label
                          key={day}
                          className="flex items-center gap-3 rounded-md border border-input px-3 py-2"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(nextChecked) => {
                              setCourseForm((current) => ({
                                ...current,
                                days: nextChecked
                                  ? Array.from(new Set([...current.days, day]))
                                  : current.days.filter((selectedDay) => selectedDay !== day),
                              }));
                            }}
                          />
                          <span className="text-sm font-medium">{day}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="course-time">Time</Label>
                  <Input
                    id="course-time"
                    value={courseForm.time}
                    onChange={(event) => setCourseForm((current) => ({ ...current, time: event.target.value }))}
                    placeholder="10:00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="course-room">Room</Label>
                  <Input
                    id="course-room"
                    value={courseForm.room}
                    onChange={(event) => setCourseForm((current) => ({ ...current, room: event.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={courseMutation.isPending}>
                  {courseMutation.isPending ? "Creating..." : "Create course"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RoleDashboardLayout>
  );
}
