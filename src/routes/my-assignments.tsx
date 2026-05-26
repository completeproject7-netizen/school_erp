import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { createSubmission, fetchAssignments, fetchCourses, fetchStudentSubmissions, type AssignmentAttachment } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/my-assignments")({ component: Page });

interface StudentAssignment {
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

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No due date";
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
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

function getStudentClass(user: { meta?: Record<string, string | undefined> } | null) {
  return user?.meta?.class || user?.meta?.grade || "";
}

function Page() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["assignments", user?.role], queryFn: fetchAssignments, enabled: !!user });
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["courses", user?.role],
    queryFn: fetchCourses,
    enabled: !!user && user.role === "student",
  });
  const { data: studentSubmissionsData, isLoading: submissionsLoading } = useQuery({
    queryKey: ["student-submissions", user?.id],
    queryFn: () => fetchStudentSubmissions(user!.id),
    enabled: !!user && user.role === "student",
  });

  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submissionMutation = useMutation({
    mutationFn: createSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries(["assignments", user?.role]);
      queryClient.invalidateQueries(["student-submissions", user?.id]);
      setSelectedAssignment(null);
      setSubmissionText("");
      setFile(null);
      setError(null);
      window.alert("Submission uploaded successfully.");
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : "Unable to submit assignment.");
    },
  });

  if (loading || isLoading || submissionsLoading || coursesLoading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "student") return <Navigate to="/assignments" />;

  const assignments = (data?.assignments ?? []) as StudentAssignment[];
  const studentClass = getStudentClass(user);
  const courseById = new Map((coursesData?.courses ?? []).map((course) => [course.id, course]));
  const visibleAssignments = assignments.filter((assignment) => {
    const course = courseById.get(assignment.courseId);
    return course?.grade === studentClass;
  });
  const submittedAssignmentIds = new Set((studentSubmissionsData?.submissions ?? []).map((submission) => submission.assignmentId));

  const handleOpenSubmission = (assignment: StudentAssignment) => {
    setSelectedAssignment(assignment);
    setSubmissionText("");
    setFile(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;
    setError(null);

    if (!submissionText.trim() && !file) {
      setError("Please write a short message or attach an image/PDF before submitting.");
      return;
    }

    if (submittedAssignmentIds.has(selectedAssignment.id)) {
      setError("You have already submitted this assignment.");
      return;
    }

    let attachment;
    if (file) {
      if (!file.type.match(/^(image\/|application\/pdf)/i)) {
        setError("Please attach an image or PDF file.");
        return;
      }
      const dataUrl = await readFileAsDataUrl(file);
      attachment = { fileName: file.name, mimeType: file.type, data: dataUrl };
    }

    await submissionMutation.mutateAsync({
      assignmentId: selectedAssignment.id,
      content: submissionText.trim() || undefined,
      attachment,
    });
  };

  return (
    <RoleDashboardLayout title="My Assignments" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "My Assignments" }]}> 
      <div className="space-y-6">
        <PageHeader title="My Assignments" description="Submit and track your work." />
        <DataTable
          title="Active Assignments"
          rows={visibleAssignments}
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
            { key: "dueDate", header: "Due", render: (r) => formatDueDate(r.dueDate) },
            { key: "attachment", header: "Teacher Material", render: (r) => <AttachmentCell attachment={r.attachment} /> },
            { key: "createdByName", header: "Teacher", render: (r) => r.createdByName || r.createdBy },
            {
              key: "action",
              header: "Submit",
              render: (r) => (
                submittedAssignmentIds.has(r.id) ? (
                  <span className="text-sm font-medium text-green-700">Submitted</span>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => handleOpenSubmission(r)}>
                    Submit
                  </Button>
                )
              ),
            },
          ]}
          emptyText="No assignments available."
        />

        <Dialog open={Boolean(selectedAssignment)} onOpenChange={(open) => { if (!open) setSelectedAssignment(null); }}>
          <DialogContent>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              {selectedAssignment ? `Submitting for: ${selectedAssignment.title}` : "Select an assignment to submit."}
            </DialogDescription>

            {selectedAssignment && (
              <div className="space-y-4 mt-4">
                <div>
                  <p className="font-medium">Course</p>
                  <p className="text-sm text-muted-foreground">{selectedAssignment.courseId}</p>
                </div>
                <div>
                  <p className="font-medium">Teacher</p>
                  <p className="text-sm text-muted-foreground">{selectedAssignment.createdByName || selectedAssignment.createdBy}</p>
                </div>
                <div>
                  <p className="font-medium">Due Date</p>
                  <p className="text-sm text-muted-foreground">{formatDueDate(selectedAssignment.dueDate)}</p>
                </div>
                <div>
                  <p className="font-medium">Assignment Details</p>
                  <p className="text-sm text-muted-foreground">{selectedAssignment.description}</p>
                </div>
                <div>
                  <p className="font-medium">Teacher Materials</p>
                  <div className="mt-1">
                    <AttachmentCell attachment={selectedAssignment.attachment} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="submission-content">Submission Notes</Label>
                  <Textarea
                    id="submission-content"
                    value={submissionText}
                    onChange={(event) => setSubmissionText(event.target.value)}
                    placeholder="Write a short summary of your submission..."
                    rows={5}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="submission-file">Attach image or PDF</Label>
                  <Input
                    id="submission-file"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                  {file && <p className="text-sm text-muted-foreground">Selected file: {file.name}</p>}
                </div>
                {submittedAssignmentIds.has(selectedAssignment.id) && (
                  <p className="text-sm text-green-700">This assignment has already been submitted.</p>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" type="button" onClick={() => setSelectedAssignment(null)} disabled={submissionMutation.isLoading}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSubmit} disabled={submissionMutation.isLoading || submittedAssignmentIds.has(selectedAssignment.id)}>
                    {submissionMutation.isLoading ? "Submitting…" : submittedAssignmentIds.has(selectedAssignment.id) ? "Already Submitted" : "Submit"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleDashboardLayout>
  );
}
