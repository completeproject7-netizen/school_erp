import { type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

export function PageStub({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      {children ?? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="size-5" />
              </div>
              <div>
                <CardTitle>Coming soon</CardTitle>
                <CardDescription>This module is part of the EduCore platform.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Enable real data, persistence, and per-user records for this section.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function StatGrid({
  stats,
}: {
  stats: { label: string; value: string; hint?: string; icon: LucideIcon; tone?: "primary" | "success" | "warning" | "accent" | "destructive" }[];
}) {
  const toneClass: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    accent: "bg-accent/10 text-accent",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <div className={`rounded-lg p-2 ${toneClass[s.tone ?? "primary"]}`}>
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              {s.hint && <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
