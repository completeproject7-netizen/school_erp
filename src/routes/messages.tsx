import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchMessages, createMessage, createMessageReply } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { PageHeader } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export const Route = createFileRoute("/messages")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["messages"], queryFn: fetchMessages });
  const [active, setActive] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const queryClient = useQueryClient();
  const replyMutation = useMutation({
    mutationFn: createMessageReply,
    onSuccess: () => {
      queryClient.invalidateQueries(["messages"]);
    },
  });
  const sendMutation = useMutation({
    mutationFn: createMessage,
    onSuccess: () => {
      queryClient.invalidateQueries(["messages"]);
      setNewSubject("");
      setNewBody("");
      window.alert("Message sent");
    },
  });
  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  const messages = data?.messages ?? [];
  const activeId = active ?? messages[0]?.id ?? null;
  const current = messages.find((m) => m.id === activeId) ?? messages[0];
  if (!current) return null;

  return (
    <RoleDashboardLayout title="Messages" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Messages" }]}>
      <div className="space-y-6">
        <PageHeader title="Messages" description="Direct conversations with colleagues." />
        <Card>
          <CardHeader><CardTitle className="text-base">Compose New Message</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Subject"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <Textarea
              placeholder="Write your message here..."
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end">
              <Button
                onClick={async () => {
                  if (!newSubject.trim() || !newBody.trim()) return;
                  try {
                    await sendMutation.mutateAsync({ subject: newSubject.trim(), body: newBody.trim() });
                  } catch (err) {
                    window.alert(err instanceof Error ? err.message : "Unable to send message");
                  }
                }}
              >
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader><CardTitle className="text-base">Inbox</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ul>
                {messages.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => setActive(m.id)}
                      className={`w-full text-left p-3 border-t hover:bg-muted/40 transition ${active === m.id ? "bg-muted/60" : ""}`}
                    >
                      <div className="flex justify-between gap-2">
                        <p className={`text-sm ${m.unread ? "font-semibold" : "font-medium"}`}>{m.from}</p>
                        <span className="text-xs text-muted-foreground">{m.at}</span>
                      </div>
                      <p className="text-xs font-medium text-foreground/80 truncate">{m.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.preview}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{current.subject}</CardTitle>
              <p className="text-sm text-muted-foreground">From {current.from} · {current.at}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">{current.preview} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Looking forward to your reply at the earliest convenience.</p>
              {current.replies && current.replies.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="text-sm font-medium">Replies</h4>
                  {current.replies.map((r: any) => (
                    <div key={r.id} className="p-3 border rounded">
                      <div className="flex justify-between">
                        <div className="text-sm font-medium">{r.from}</div>
                        <div className="text-xs text-muted-foreground">{r.at}</div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{r.body}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t pt-4 space-y-2">
                <Textarea placeholder="Type your reply..." value={replyBody} onChange={(e) => setReplyBody(e.target.value)} rows={5} />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={async () => {
                      if (!replyBody.trim()) return;
                      try {
                        await replyMutation.mutateAsync({ messageId: current.id, body: replyBody.trim() });
                        setReplyBody("");
                        queryClient.invalidateQueries(["messages"]);
                        window.alert("Reply sent");
                      } catch (err) {
                        window.alert(err instanceof Error ? err.message : "Unable to send reply");
                      }
                    }}
                  >
                    Send Reply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
