import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchEvents, createEvent, approveEvent, deleteEvent } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { PageHeader } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, MapPin, Clock, Plus } from "lucide-react";

export const Route = createFileRoute("/events")({ component: Page });

const TONE: Record<string, string> = {
  Academic: "bg-primary/10 text-primary",
  Sports: "bg-success/15 text-success",
  Cultural: "bg-accent/15 text-accent-foreground",
  Meeting: "bg-warning/15 text-warning-foreground",
  Holiday: "bg-destructive/10 text-destructive",
};

function Page() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [category, setCategory] = useState("");
  const [attendees, setAttendees] = useState("");

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries(["events"]);
      setOpen(false);
      setTitle("");
      setDate("");
      setTime("");
      setVenue("");
      setCategory("");
      setAttendees("");
    },
  });

  const approveMutation = useMutation({
    mutationFn: approveEvent,
    onSuccess: () => queryClient.invalidateQueries(["events"]),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => queryClient.invalidateQueries(["events"]),
  });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const events = data?.events ?? [];
  const requests = data?.requests ?? [];
  const pendingCount = requests.length;
  const isAdmin = user.role === "administrator";
  const eventSource = data?.connected ? "Connected to MongoDB Atlas" : "Events not loaded from database";

  const handleSubmit = () => {
    if (!title || !date || !time || !venue || !category || !attendees) {
      window.alert("Please fill in all event fields.");
      return;
    }
    createMutation.mutate({ title, date, time, venue, category, attendees });
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this event?")) return;
    deleteMutation.mutate(id);
  };

  return (
    <RoleDashboardLayout title="Events" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Events" }]}> 
      <div className="space-y-6">
        <PageHeader
          title="School Events"
          description={`Upcoming meetings, exams and activities. ${eventSource}`}
          actions={
            <div className="flex items-center gap-2">
              <Button onClick={() => setOpen(true)}><Plus className="size-4" />{isAdmin ? "New Event" : "Request Event"}</Button>
              {isAdmin && pendingCount > 0 && (
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                  {pendingCount} Pending Request{pendingCount === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
          }
        />

        {isAdmin && requests.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Pending Event Requests</h2>
                <p className="text-sm text-muted-foreground">Approve or delete requested events before they appear on the calendar.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {requests.map((e) => (
                <Card key={e.id} className="card-hover overflow-hidden border border-border">
                  <div className={`h-1.5 ${TONE[e.category]}`} />
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{e.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">Requested by {e.requestedByName}</p>
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><CalendarDays className="size-4" />{e.date}</div>
                    <div className="flex items-center gap-2"><Clock className="size-4" />{e.time}</div>
                    <div className="flex items-center gap-2"><MapPin className="size-4" />{e.venue}</div>
                    <p className="pt-2 text-xs">For: {e.attendees}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button size="sm" onClick={() => handleApprove(e.id)} disabled={approveMutation.isLoading}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(e.id)} disabled={deleteMutation.isLoading}>Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger">
          {events.map((e) => (
            <Card key={e.id} className="card-hover overflow-hidden">
              <div className={`h-1.5 ${TONE[e.category]}`} />
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{e.title}</CardTitle>
                  <Badge variant="outline">{e.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><CalendarDays className="size-4" />{e.date}</div>
                <div className="flex items-center gap-2"><Clock className="size-4" />{e.time}</div>
                <div className="flex items-center gap-2"><MapPin className="size-4" />{e.venue}</div>
                <p className="pt-2 text-xs">For: {e.attendees}</p>
                {isAdmin && (
                  <Button size="sm" variant="outline" onClick={() => handleDelete(e.id)} disabled={deleteMutation.isLoading}>Delete</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isAdmin ? "Add Event" : "Request Event"}</DialogTitle>
              <DialogDescription>{isAdmin ? "Create a new calendar event." : "Request a new event for approval."}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="event-title">Title</Label>
                <Input id="event-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Event title" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="event-date">Date</Label>
                  <Input id="event-date" value={date} onChange={(event) => setDate(event.target.value)} placeholder="May 23" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event-time">Time</Label>
                  <Input id="event-time" value={time} onChange={(event) => setTime(event.target.value)} placeholder="10:00 AM" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-venue">Venue</Label>
                <Input id="event-venue" value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="Main Auditorium" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-category">Category</Label>
                <Input id="event-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Academic, Sports, Cultural" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-attendees">Attendees</Label>
                <Input id="event-attendees" value={attendees} onChange={(event) => setAttendees(event.target.value)} placeholder="All students" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isLoading}>{createMutation.isLoading ? "Saving…" : (isAdmin ? "Save Event" : "Request Event")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleDashboardLayout>
  );
}
