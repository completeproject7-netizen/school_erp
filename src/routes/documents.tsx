import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchDocuments, uploadDocument } from "@/lib/api";
import { RoleDashboardLayout } from "@/components/RoleDashboardLayout";
import { DataTable, PageHeader } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/documents")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [uploadOwner, setUploadOwner] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["documents"], queryFn: fetchDocuments });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) {
        throw new Error("Please select a document to upload.");
      }

      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result !== "string") {
            return reject(new Error("Unable to read file."));
          }
          const base64 = result.split(",")[1] || "";
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(uploadFile);
      });

      return uploadDocument({
        owner: uploadOwner || "Unknown",
        name: uploadFile.name,
        type: uploadFile.type || "Unknown",
        size: `${Math.round(uploadFile.size / 1024)} KB`,
        data: fileData,
      });
    },
    onSuccess: () => {
      setShowUpload(false);
      setUploadFile(null);
      setUploadOwner("");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err: any) => {
      setUploadError(err?.message || "Upload failed.");
    },
  });

  if (loading || isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  const documents = data?.documents ?? [];
  const canUpload = user.role === "admission" || user.role === "administrator";

  return (
    <RoleDashboardLayout title="Documents" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Documents" }]}>
      <div className="space-y-6">
        <PageHeader title="Documents" description="Applicant documents and verifications." />
        {canUpload && (
          <div className="rounded-lg border border-border bg-muted/50 p-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Applicant / Owner ID</label>
                <Input
                  value={uploadOwner}
                  onChange={(event) => setUploadOwner(event.target.value)}
                  placeholder="AP-501 or student id"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Select Document</label>
                <Input
                  type="file"
                  accept=".pdf,image/*,.doc,.docx,.txt"
                  onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                />
              </div>
              <div className="flex flex-col justify-end gap-2">
                <div className="text-sm text-muted-foreground">{uploadFile ? uploadFile.name : "No file selected"}</div>
                <Button size="sm" onClick={() => setShowUpload(true)} disabled={!uploadFile}>
                  Upload Document
                </Button>
              </div>
            </div>
            {uploadError ? <p className="mt-3 text-sm text-destructive">{uploadError}</p> : null}
          </div>
        )}

        {showUpload && canUpload && (
          <div className="rounded-lg border border-border bg-background/80 p-5">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">Confirm upload of the selected document to the admissions document vault.</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isLoading || !uploadFile}>
                  {uploadMutation.isLoading ? "Uploading..." : "Confirm Upload"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowUpload(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {!canUpload && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
            Only Admission Support users can upload documents.
          </div>
        )}

        <DataTable
          title="Document Vault"
          rows={documents}
          primaryAction={canUpload ? { label: "Upload Document", onClick: () => setShowUpload(true) } : undefined}
          columns={[
            { key: "name", header: "Document", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "type", header: "Type", render: (r) => <Badge variant="outline">{r.type}</Badge> },
            { key: "owner", header: "Linked To", render: (r) => <span className="font-mono text-xs">{r.owner}</span> },
            { key: "uploaded", header: "Uploaded" },
            { key: "size", header: "Size" },
          ]}
        />
      </div>
    </RoleDashboardLayout>
  );
}
