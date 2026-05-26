import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { PageHeader } from "@/components/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <RoleDashboardLayout title="Settings" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Settings" }]}>
      <div className="space-y-6">
        <PageHeader title="Settings" description="Configure your institution profile and preferences." />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Institution</CardTitle>
              <CardDescription>Public profile information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Name</Label><Input defaultValue="EduCore International School" className="mt-1.5" /></div>
              <div><Label>Address</Label><Input defaultValue="221B Maple Avenue, Springfield" className="mt-1.5" /></div>
              <div><Label>Academic Year</Label><Input defaultValue="2025–2026" className="mt-1.5" /></div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Notifications and behaviour.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { l: "Email notifications", d: "Receive a daily activity summary" , v: true },
                { l: "Parent SMS alerts", d: "Send absence alerts to parents", v: true },
                { l: "Auto-publish grades", d: "Push grades to students immediately", v: false },
                { l: "Two-factor authentication", d: "Require 2FA for all admin logins", v: true },
              ].map((p) => (
                <div key={p.l} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.l}</p>
                    <p className="text-xs text-muted-foreground">{p.d}</p>
                  </div>
                  <Switch defaultChecked={p.v} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
