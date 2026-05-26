import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchCourses } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { PageHeader } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/my-courses")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["courses"], queryFn: fetchCourses });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const courses = data?.courses ?? [];
  const mine = courses.slice(0, 4);

  return (
    <RoleDashboardLayout title="My Courses" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "My Courses" }]}> 
      <div className="space-y-6">
        <PageHeader title="My Courses" description="Courses you are enrolled in this term." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger">
          {mine.map((c) => (
            <Card key={c.id} className="card-hover">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <BookOpen className="size-5" />
                  </div>
                  <Badge variant="outline">{c.credits} cr</Badge>
                </div>
                <CardTitle className="text-base mt-3">{c.title}</CardTitle>
                <p className="text-xs font-mono text-muted-foreground">{c.id}</p>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>Instructor: <span className="text-foreground">{c.teacherId ?? "TBA"}</span></p>
                <p>Created: {new Date(c.createdAt).toLocaleDateString()}</p>
                <p>{c.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
