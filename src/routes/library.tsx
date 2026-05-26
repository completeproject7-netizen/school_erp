import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchDocuments, fetchLibraryBooks, uploadDocument } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader } from "@/components/DataTable";
import { StatGrid } from "@/components/PageStub";
import { Library, BookOpen, BookCheck, Tag, FileText, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/library")({ component: Page });

function openSharedMaterial(content: string | null | undefined, type: string, name: string) {
  if (!content) {
    return;
  }

  const dataUrl = `data:${type};base64,${content}`;
  window.open(dataUrl, `material-${name}`, "noopener,noreferrer");
}

function Page() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["library"],
    queryFn: async () => {
      const [booksResponse, documentsResponse] = await Promise.all([
        fetchLibraryBooks(),
        fetchDocuments(),
      ]);

      return {
        books: booksResponse.books,
        documents: documentsResponse.documents,
      };
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("You need to be logged in to upload a resource.");
      }
      if (!uploadFile) {
        throw new Error("Select a file to upload.");
      }

      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result !== "string") {
            reject(new Error("Unable to read file."));
            return;
          }

          const base64 = result.split(",")[1] || "";
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(uploadFile);
      });

      return uploadDocument({
        owner: user.name,
        name: uploadFile.name,
        type: uploadFile.type || "application/octet-stream",
        size: `${Math.round(uploadFile.size / 1024)} KB`,
        data: fileData,
      });
    },
    onSuccess: () => {
      setShowUpload(false);
      setUploadFile(null);
      setUploadError("");
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error: Error) => {
      setUploadError(error?.message || "Upload failed.");
    },
  });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const books = data?.books ?? [];
  const documents = data?.documents ?? [];
  const totalCopies = books.reduce((a, b) => a + b.copies, 0);
  const available = books.reduce((a, b) => a + b.available, 0);
  const canUpload = user.role === "teacher";

  return (
    <RoleDashboardLayout title="Library" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Library" }]}> 
      <div className="space-y-6">
        <PageHeader
          title="Library Catalog"
          description="Browse books and teacher-shared materials in one place."
        />
        <StatGrid stats={[
          { label: "Titles", value: String(books.length + documents.length), icon: Library, tone: "primary" },
          { label: "Total Copies", value: String(totalCopies), icon: BookOpen, tone: "accent" },
          { label: "Available", value: String(available), icon: BookCheck, tone: "success" },
          { label: "Shared Materials", value: String(documents.length), icon: FileText, tone: "warning" },
        ]} />

        {canUpload && (
          <div className="rounded-lg border border-border bg-muted/50 p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Upload a PDF or study resource</p>
                <p className="text-sm text-muted-foreground">Students will see the uploaded item in the shared library list.</p>
              </div>
              <Button size="sm" onClick={() => setShowUpload((current) => !current)}>
                {showUpload ? "Hide Upload" : "Upload PDF"}
              </Button>
            </div>

            {showUpload && (
              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Select file</label>
                    <Input
                      type="file"
                      accept="*/*"
                      onChange={(event) => {
                        setUploadFile(event.target.files?.[0] ?? null);
                        setUploadError("");
                      }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {uploadFile ? `Selected: ${uploadFile.name}` : "No file selected"}
                  </div>
                  {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isLoading || !uploadFile}>
                    {uploadMutation.isLoading ? "Uploading..." : "Confirm Upload"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowUpload(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DataTable
          title="Catalog"
          rows={books}
          columns={[
            { key: "title", header: "Title", render: (r) => <span className="font-medium">{r.title}</span> },
            { key: "author", header: "Author" },
            { key: "category", header: "Category" },
            { key: "isbn", header: "ISBN", render: (r) => <span className="font-mono text-xs">{r.isbn}</span> },
            { key: "available", header: "Available", render: (r) => (
              <Badge variant={r.available === 0 ? "destructive" : "outline"}>{r.available} / {r.copies}</Badge>
            )},
          ]}
        />

        <DataTable
          title="Shared Materials"
          rows={documents}
          columns={[
            { key: "name", header: "Title", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "type", header: "Type", render: (r) => <Badge variant="outline">{r.type}</Badge> },
            { key: "owner", header: "Uploaded By" },
            { key: "uploaded", header: "Uploaded" },
            { key: "size", header: "Size" },
            {
              key: "action",
              header: "Open",
              render: (r) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openSharedMaterial(r.content, r.type, r.name)}
                  disabled={!r.content}
                >
                  <ExternalLink className="size-4" />
                  {r.content ? "Open" : "Unavailable"}
                </Button>
              ),
            },
          ]}
        />
      </div>
    </RoleDashboardLayout>
  );
}
