import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { PageHeader } from "@/components/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/my-profile")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("");

  return (
    <RoleDashboardLayout title="My Profile" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "My Profile" }]}>
      <div className="space-y-6">
        <PageHeader title="My Profile" description="Personal and employment details." />
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="size-24">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <h3 className="font-display text-lg font-semibold mt-4">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-2">Department: {user.meta?.dept ?? "General"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Personal Info</CardTitle><CardDescription>Update your details.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Full Name</Label><Input defaultValue={user.name} className="mt-1.5" /></div>
                <div><Label>Email</Label><Input defaultValue={user.email} className="mt-1.5" /></div>
                <div><Label>Phone</Label><Input defaultValue="+1 555-0205" className="mt-1.5" /></div>
                <div><Label>Department</Label><Input defaultValue={user.meta?.dept ?? "General"} className="mt-1.5" /></div>
                <div className="md:col-span-2"><Label>Address</Label><Input defaultValue="42 Oak Street, Springfield" className="mt-1.5" /></div>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
