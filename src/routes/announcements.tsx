import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchAnnouncements, createAnnouncement, deleteAnnouncement } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { PageHeader } from "@/components/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Pin, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/announcements")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("All students");
  const [pinned, setPinned] = useState(false);

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries(["announcements"]);
      setOpen(false);
      setTitle("");
      setBody("");
      setAudience("All students");
      setPinned(false);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => queryClient.invalidateQueries(["announcements"]),
  });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  const announcements = data?.announcements ?? [];
  const announcementSource = data?.connected ? "Connected to MongoDB Atlas" : "Announcements not loaded from database";

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      window.alert("Announcement deleted");
    } catch (err: any) {
      window.alert(err?.message || "Failed to delete announcement");
    }
  };

  return (
    <RoleDashboardLayout title="Announcements" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Announcements" }]}>
      <div className="space-y-6">
        <PageHeader
          title="Announcements"
          description={`School-wide notices and updates. ${announcementSource}`}
          actions={
            user.role === "administrator" ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="size-4" />New Announcement</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Announcement</DialogTitle>
                    <DialogDescription>Publish a new announcement for the selected audience.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="announcement-title">Title</Label>
                      <Input
                        id="announcement-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Announcement title"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="announcement-body">Body</Label>
                      <Textarea
                        id="announcement-body"
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        placeholder="Explain the announcement details"
                        rows={5}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="announcement-audience">Audience</Label>
                      <Input
                        id="announcement-audience"
                        value={audience}
                        onChange={(event) => setAudience(event.target.value)}
                        placeholder="All students"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="announcement-pinned"
                        type="checkbox"
                        checked={pinned}
                        onChange={(event) => setPinned(event.target.checked)}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                      />
                      <Label htmlFor="announcement-pinned">Pin announcement</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => createMutation.mutate({ title, body, audience, pinned })}
                      disabled={createMutation.isLoading || !title || !body || !audience}
                    >
                      {createMutation.isLoading ? "Publishing…" : "Publish Announcement"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : undefined
          }
        />

        <div className="grid gap-4 stagger">
          {announcements.map((a) => (
            <Card key={a.id} className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      {a.pinned ? <Pin className="size-5" /> : <Bell className="size-5" />}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {a.title}
                        {a.pinned && <Badge variant="secondary" className="text-[10px]">PINNED</Badge>}
                      </CardTitle>
                      <CardDescription>By {a.postedBy} · {a.postedAt}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{a.audience}</Badge>
                    {user.role === "administrator" && (
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)} disabled={deleteMutation.isLoading}>
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
