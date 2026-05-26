import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { createAssignment, fetchAssignments, fetchCourses, fetchStudents, fetchSubmissions, type AssignmentAttachment } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/assignments")({ component: Page });

interface AssignmentRow {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string | null;
  createdBy: string;
  createdByName?: string | null;
  attachment?: AssignmentAttachment | null;
  createdAt: string;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read file."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function isImageAttachment(attachment?: AssignmentAttachment | null) {
  return Boolean(attachment?.mimeType && attachment.mimeType.startsWith("image/"));
}

function AttachmentCell({ attachment }: { attachment?: AssignmentAttachment | null }) {
  if (!attachment) {
    return <span className="text-sm text-muted-foreground">No attachment</span>;
  }

  if (isImageAttachment(attachment)) {
    return (
      <div className="flex items-center gap-3">
        <img src={attachment.data} alt={attachment.fileName} className="h-14 w-14 rounded border object-cover" />
        <div>
          <p className="text-sm font-medium">{attachment.fileName}</p>
          <a href={attachment.data} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
            View image
          </a>
        </div>
      </div>
    );
  }

  return (
    <a href={attachment.data} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline">
      Open PDF · {attachment.fileName}
    </a>
  );
}

function parseClassList(value?: string | null) {
  return String(value || "")
    .split(/[,&]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function Page() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["assignments"], queryFn: fetchAssignments });
  const { data: submissionsData, isLoading: submissionsLoading } = useQuery({
    queryKey: ["submissions"],
    queryFn: fetchSubmissions,
    enabled: !!user && user.role !== "student",
  });
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
    enabled: !!user && user.role !== "student",
  });
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries(["assignments"]);
      setOpen(false);
      setTitle("");
      setCourseId("");
      setDescription("");
      setDueDate("");
      setAttachmentFile(null);
      setUploadError(null);
      window.alert("Assignment created successfully.");
    },
    onError: (error: unknown) => {
      window.alert(error instanceof Error ? error.message : "Unable to create assignment.");
    },
  });

  const handleCreateAssignment = async () => {
    setUploadError(null);

    if (!title || !courseId || !description) {
      return;
    }

    const attachment = attachmentFile
      ? (() => {
          if (!attachmentFile.type.match(/^(image\/|application\/pdf)/i)) {
            setUploadError("Please choose an image or PDF file.");
            return null;
          }

          return { fileName: attachmentFile.name, mimeType: attachmentFile.type, data: "" };
        })()
      : undefined;

    if (attachmentFile && !attachment) {
      return;
    }

    let finalAttachment = attachment;
    if (attachmentFile) {
      try {
        const data = await readFileAsDataUrl(attachmentFile);
        finalAttachment = { fileName: attachmentFile.name, mimeType: attachmentFile.type, data };
      } catch {
        setUploadError("Unable to read the selected file.");
        return;
      }
    }

    mutation.mutate({
      title,
      courseId,
      description,
      dueDate: dueDate || undefined,
      attachment: finalAttachment,
    });
  };

  if (loading || isLoading || submissionsLoading || studentsLoading || coursesLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const assignments = (data?.assignments ?? []) as AssignmentRow[];
  const submissions = submissionsData?.submissions ?? [];
  const studentNameById = new Map((studentsData?.students ?? []).map((student) => [student.id, student.name]));
  const allCourses = coursesData?.courses ?? [];
  const courseById = new Map(allCourses.map((course) => [course.id, course]));
  const teacherClasses = parseClassList(user.role === "teacher" ? user.meta?.classes : null);
  const teacherHasAssignedClasses = user.role === "teacher" && teacherClasses.length > 0;
  const availableCourses = user.role === "teacher"
    ? allCourses.filter((course) => {
        if (teacherClasses.length) {
          return teacherClasses.includes(course.grade || "");
        }
        return course.teacherName === user.name || !course.teacherName;
      })
    : allCourses;
  const filteredAssignments = user.role === "teacher"
    ? assignments.filter((assignment) => {
        const course = courseById.get(assignment.courseId);
        if (course && teacherClasses.length) {
          return teacherClasses.includes(course.grade || "");
        }
        if (course && !teacherClasses.length) {
          return course.teacherName === user.name || !course.teacherName;
        }
        return assignment.createdBy === user.id;
      })
    : assignments;

  return (
    <RoleDashboardLayout title="Assignments" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Assignments" }]}> 
      <div className="space-y-6">
        <PageHeader
          title="Assignments"
          description={user.role === "teacher"
            ? "Manage assignments for your assigned classes."
            : "Manage tasks and submissions."}
          actions={teacherHasAssignedClasses ? (
            <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Assigned class</Badge>
                <span className="font-medium">{teacherClasses.join(", ")}</span>
              </div>
            </div>
          ) : undefined}
        />
        {teacherHasAssignedClasses && availableCourses.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            No courses are currently available for your assigned classes. Please contact an administrator to verify the class-to-course mapping.
          </div>
        ) : null}
        <DataTable
          title={user.role === "teacher" ? "My Assignments" : "All Assignments"}
          rows={filteredAssignments}
          primaryAction={user.role === "teacher" || user.role === "administrator"
            ? { label: "Create Assignment", onClick: () => setOpen(true) }
            : undefined}
          columns={[
            { key: "title", header: "Title", render: (r) => <span className="font-medium">{r.title}</span> },
            { key: "description", header: "Description", render: (r) => <span className="text-sm text-muted-foreground">{r.description}</span>, className: "max-w-xl" },
            {
              key: "courseId",
              header: "Course",
              render: (r) => {
                const course = courseById.get(r.courseId);
                return (
                  <div>
                    <p className="text-sm font-medium">{course?.title ?? r.courseId}</p>
                    <p className="text-xs text-muted-foreground">{course?.grade || "Grade not set"}</p>
                  </div>
                );
              },
            },
            { key: "dueDate", header: "Due" },
            { key: "attachment", header: "Attachment", render: (r) => <AttachmentCell attachment={r.attachment} /> },
            { key: "createdByName", header: "Created By", render: (r) => r.createdByName || r.createdBy },
          ]}
        />

        {user.role !== "student" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Submission Review</h2>
              <p className="text-sm text-muted-foreground">Review uploaded student work and open the attached image or PDF.</p>
            </div>
            {filteredAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignments available for review.</p>
            ) : (
              filteredAssignments.map((assignment) => {
                const assignmentSubmissions = submissions.filter((submission) => submission.assignmentId === assignment.id);
                return (
                  <div key={assignment.id} className="rounded-lg border p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">Course {assignment.courseId}</p>
                    </div>
                    {assignmentSubmissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No submissions yet.</p>
                    ) : (
                      <div className="grid gap-3">
                        {assignmentSubmissions.map((submission) => (
                          <div key={submission.id} className="rounded border p-3 space-y-2">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm font-medium">{studentNameById.get(submission.studentId) ?? `Student ${submission.studentId}`}</p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted {new Date(submission.submittedAt).toLocaleString()}
                                </p>
                              </div>
                              <span className="text-xs rounded-full bg-muted px-2 py-1">{submission.attachment ? "Attached file" : "Text only"}</span>
                            </div>
                            {submission.content ? (
                              <p className="text-sm text-muted-foreground">{submission.content}</p>
                            ) : null}
                            <div>
                              <AttachmentCell attachment={submission.attachment ?? null} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) { setUploadError(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Assignment</DialogTitle>
              <DialogDescription>Add the assignment details and optionally attach an image or PDF.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="assignment-title">Title</Label>
                <Input
                  id="assignment-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Assignment title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignment-course">Course</Label>
                <select
                  id="assignment-course"
                  value={courseId}
                  onChange={(event) => setCourseId(event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select a course</option>
                  {availableCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} — {course.grade || "Grade not set"}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Assignments are linked to the live courses stored in the database.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignment-description">Description</Label>
                <Textarea
                  id="assignment-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Assignment details"
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignment-due">Due Date</Label>
                <Input
                  id="assignment-due"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignment-file">Attachment (image or PDF)</Label>
                <Input
                  id="assignment-file"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setAttachmentFile(file);
                  }}
                />
                {attachmentFile && <p className="text-sm text-muted-foreground">Selected file: {attachmentFile.name}</p>}
                {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  void handleCreateAssignment();
                }}
                disabled={mutation.isLoading || !title || !courseId || !description}
              >
                {mutation.isLoading ? "Creating…" : "Create Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleDashboardLayout>
  );
}
