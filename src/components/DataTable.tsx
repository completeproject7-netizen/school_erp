import { type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Download } from "lucide-react";
import { statusTone } from "@/lib/db";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface Props<T> {
  title: string;
  description?: string;
  rows: T[];
  columns: Column<T>[];
  searchable?: boolean;
  primaryAction?: { label: string; onClick?: () => void };
  emptyText?: string;
}

function formatCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function downloadCsv<T extends { id: string }>(name: string, rows: T[], columns: Column<T>[]) {
  const headers = columns.map((column) => `"${String(column.header).replace(/"/g, '""')}"`).join(",");
  const lines = rows.map((row) =>
    columns
      .map((column) => {
        const rawValue = (row as Record<string, unknown>)[String(column.key)];
        const cell = formatCsvValue(rawValue);
        return `"${cell.replace(/"/g, '""')}"`;
      })
      .join(","),
  );
  const csv = [headers, ...lines].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_-]/g, "")}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DataTable<T extends { id: string }>({
  title,
  description,
  rows,
  columns,
  searchable = true,
  primaryAction,
  emptyText = "No records found.",
}: Props<T>) {
  const handleExport = () => {
    downloadCsv(title, rows, columns);
  };

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex items-center gap-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input placeholder="Search..." className="w-56 pl-8 h-9" />
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4" />Export
          </Button>
          {primaryAction && (
            <Button size="sm" onClick={primaryAction.onClick}>
              <Plus className="size-4" />{primaryAction.label}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                {columns.map((c) => (
                  <th key={String(c.key)} className={`px-4 py-3 font-medium text-muted-foreground ${c.className ?? ""}`}>
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="p-8 text-center text-muted-foreground">{emptyText}</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30 transition-colors">
                    {columns.map((c) => (
                      <td key={String(c.key)} className={`px-4 py-3 ${c.className ?? ""}`}>
                        {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key as string] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const tone = statusTone(value);
  const map = {
    success: "bg-success/15 text-success border-success/30",
    warning: "bg-warning/15 text-warning-foreground border-warning/40",
    destructive: "bg-destructive/15 text-destructive border-destructive/30",
    default: "bg-muted text-muted-foreground border-border",
    secondary: "bg-secondary text-secondary-foreground border-border",
  } as const;
  return (
    <Badge variant="outline" className={`${map[tone]} font-medium`}>
      {value}
    </Badge>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
