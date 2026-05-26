import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchEnrollments, enrollStudent } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader, StatusBadge } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/enrollment")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["enrollments"], queryFn: fetchEnrollments });
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [parentMobileInput, setParentMobileInput] = useState("");
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);

  const enrollMutation = useMutation({
    mutationFn: (payload: { id: string; email: string; parentMobile: string }) =>
      enrollStudent(payload.id, payload.email, payload.parentMobile),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      // If the server returned analytics snapshot, update cache immediately
      if (data?.analytics) {
        queryClient.setQueryData(["analytics"], data.analytics);
      } else {
        queryClient.invalidateQueries({ queryKey: ["analytics"] });
      }
      toast.success("Student enrolled and administrator notified");
      setEmailDialogOpen(false);
      setEmailInput("");
      setParentMobileInput("");
      setSelectedEnrollmentId(null);
    },
    onError: (err: any) => toast.error(err?.message || "Failed to enroll student"),
  });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const enrollments = data?.enrollments ?? [];

  const handleEnrollClick = (id: string) => {
    setSelectedEnrollmentId(id);
    setEmailInput("");
    setParentMobileInput("");
    setEmailDialogOpen(true);
  };

  const handleConfirmEnroll = () => {
    if (!emailInput.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!emailInput.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!parentMobileInput.trim()) {
      toast.error("Please enter the parent's mobile number");
      return;
    }
    if (parentMobileInput.replace(/[^0-9]/g, "").length < 7) {
      toast.error("Please enter a valid parent mobile number");
      return;
    }
    if (selectedEnrollmentId) {
      enrollMutation.mutate({
        id: selectedEnrollmentId,
        email: emailInput,
        parentMobile: parentMobileInput,
      });
    }
  };

  return (
    <RoleDashboardLayout title="Enrollment" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Enrollment" }]}>
      <div className="space-y-6">
        <PageHeader title="Enrollment" description="Approved students ready for onboarding." />
        <DataTable
          title="Enrollment Queue"
          rows={enrollments}
          columns={[
            { key: "id", header: "Enrollment ID" },
            { key: "applicant", header: "Student", render: (r) => <span className="font-medium">{r.applicant}</span> },
            { key: "appliedFor", header: "Grade" },
            { key: "score", header: "Entrance Score", render: (r) => r.score ?? "—" },
            { key: "enrollmentStatus", header: "Status", render: (r) => <StatusBadge value={r.enrollmentStatus} /> },
            {
              key: "actions",
              header: "",
              render: (r) => (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEnrollClick(r.id)}
                  disabled={r.enrollmentStatus === "Enrolled" || enrollMutation.status === "pending"}
                >
                  <CheckCircle2 className="size-4" />
                  {r.enrollmentStatus === "Enrolled" ? "Enrolled" : "Enroll"}
                </Button>
              ),
            },
          ]}
        />
      </div>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Contact Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Student Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmEnroll()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentMobile">Parent's Mobile Number</Label>
              <Input
                id="parentMobile"
                type="tel"
                placeholder="+91 98765 43210"
                value={parentMobileInput}
                onChange={(e) => setParentMobileInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmEnroll()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmEnroll} disabled={enrollMutation.status === "pending"}>
              {enrollMutation.status === "pending" ? "Enrolling..." : "Confirm & Enroll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleDashboardLayout>
  );
}
