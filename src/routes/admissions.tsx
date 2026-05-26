import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchApplications, createApplication, updateApplication, deleteApplication, confirmApplication } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader, StatusBadge } from "@/components/DataTable";
import { StatGrid } from "@/components/PageStub";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, FileText, CheckCircle2, Clock, Edit, Trash, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admissions")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["applications"], queryFn: fetchApplications });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ applicant: "", appliedFor: "", stage: "New", score: "" });

  const gradeOptions = Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`);

  const createMutation = useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setOpen(false);
      setFormData({ applicant: "", appliedFor: "", stage: "New", score: "" });
      toast.success("Application created");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to create application"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, stage, score }: { id: string; stage: string; score?: string }) => {
      const payload: any = { stage };
      if (score && score !== "") {
        payload.score = Number(score);
      }
      return updateApplication(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setEditingId(null);
      setFormData({ applicant: "", appliedFor: "", stage: "New", score: "" });
      setOpen(false);
      toast.success("Application updated");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to update application"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application deleted");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to delete application"),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Application confirmed and moved to enrollment");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to confirm application"),
  });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const applications = data?.applications ?? [];
  const approved = applications.filter((a) => a.stage === "Approved").length;
  const pending = applications.filter((a) => ["New", "Documents", "Interview"].includes(a.stage)).length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicant || !formData.appliedFor) {
      toast.error("Applicant and Applied For are required");
      return;
    }

    const score = formData.score ? Number(formData.score) : undefined;
    if (score !== undefined && (Number.isNaN(score) || score < 0 || score > 100)) {
      toast.error("Score must be between 0 and 100");
      return;
    }

    createMutation.mutate({
      applicant: formData.applicant,
      appliedFor: formData.appliedFor,
      stage: formData.stage,
      score,
    });
  };

  const handleUpdate = (id: string) => {
    if (!formData.stage) {
      toast.error("Stage is required");
      return;
    }

    const score = formData.score ? Number(formData.score) : undefined;
    if (score !== undefined && (Number.isNaN(score) || score < 0 || score > 100)) {
      toast.error("Score must be between 0 and 100");
      return;
    }

    updateMutation.mutate({
      id,
      stage: formData.stage,
      score: formData.score,
    });
  };

  const openEditDialog = (app: any) => {
    setEditingId(app.id);
    setFormData({ applicant: app.applicant, appliedFor: app.appliedFor, stage: app.stage, score: String(app.score || "") });
    setOpen(true);
  };

  return (
    <RoleDashboardLayout title="Admissions" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Admissions" }]}>
      <div className="space-y-6">
        <PageHeader
          title="Admissions"
          description={user.role === "administrator" ? "Track all applicants from inquiry to enrollment." : "Manage student applications and track their admission stages."}
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingId(null); setFormData({ applicant: "", appliedFor: "", stage: "New", score: "" }); }}>
                  <Plus className="size-4" />New Application
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Update Application" : "New Application"}</DialogTitle>
                  <DialogDescription>
                    {editingId ? "Update the application stage and details." : "Add a new student application."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={editingId ? (e) => { e.preventDefault(); handleUpdate(editingId); } : handleCreate} className="space-y-4">
                  {!editingId && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="applicant">Applicant Name</Label>
                        <Input
                          id="applicant"
                          value={formData.applicant}
                          onChange={(e) => setFormData({ ...formData, applicant: e.target.value })}
                          placeholder="Full name"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="appliedFor">Applied For</Label>
                        <select
                          id="appliedFor"
                          value={formData.appliedFor}
                          onChange={(e) => setFormData({ ...formData, appliedFor: e.target.value })}
                          required
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="" disabled>Select grade</option>
                          {gradeOptions.map((grade) => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  {editingId && applications.find(a => a.id === editingId)?.studentId && (
                    <div className="grid gap-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input
                        id="studentId"
                        value={applications.find(a => a.id === editingId)?.studentId || ""}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="stage">Stage</Label>
                    <Input
                      id="stage"
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                      placeholder="New/Documents/Interview/Approved/Waitlist/Rejected"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="score">Score (optional)</Label>
                    <Input
                      id="score"
                      type="number"
                      min={0}
                      max={100}
                      value={formData.score}
                      onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                      placeholder="e.g., 85"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); setEditingId(null); }}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.status === "pending" || updateMutation.status === "pending"}
                    >
                      {createMutation.status === "pending" || updateMutation.status === "pending" ? "Saving..." : editingId ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />

        <StatGrid
          stats={[
            { label: "Total Applications", value: String(applications.length), icon: Building2, tone: "primary" },
            { label: "In Progress", value: String(pending), icon: Clock, tone: "warning" },
            { label: "Approved", value: String(approved), icon: CheckCircle2, tone: "success" },
            { label: "Documents Pending", value: String(applications.filter((a) => a.stage === "Documents").length), icon: FileText, tone: "accent" },
          ]}
        />

        <DataTable
          title="Applications"
          description={user.role === "administrator" ? "All admission applications this term" : "Student applications you are managing"}
          rows={applications}
          columns={[
            { key: "id", header: "App ID" },
            { key: "studentId", header: "Student ID", render: (r) => r.studentId ? <span className="font-mono text-sm font-semibold">{r.studentId}</span> : <span className="text-muted-foreground">—</span> },
            { key: "applicant", header: "Applicant", render: (r) => <span className="font-medium">{r.applicant}</span> },
            { key: "appliedFor", header: "Applied For" },
            { key: "date", header: "Date" },
            { key: "score", header: "Score", render: (r) => r.score ?? "—" },
            { key: "stage", header: "Stage", render: (r) => <StatusBadge value={r.stage} /> },
            {
              key: "actions",
              header: "",
              render: (r) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEditDialog(r)} disabled={updateMutation.status === "pending"}>
                    <Edit className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => confirmMutation.mutate(r.id)}
                    disabled={confirmMutation.status === "pending" || r.stage === "Confirmed"}
                  >
                    Confirm
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(r.id)} disabled={deleteMutation.status === "pending"}>
                    <Trash className="size-4" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>
    </RoleDashboardLayout>
  );
}
