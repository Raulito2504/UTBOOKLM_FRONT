"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/src/components/ui/page-header";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  deleteDocument,
  listDocuments,
  uploadDocument,
} from "@/src/services/documents";
import type { Document, DocumentStatus } from "@/src/types/documents";

const statusLabels: Record<DocumentStatus, string> = {
  ready: "Indexado",
  processing: "Procesando",
  error: "Error",
};

const statusVariants: Record<DocumentStatus, "success" | "warning" | "error"> = {
  ready: "success",
  processing: "warning",
  error: "error",
};

export function DocumentsView() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listDocuments();
      setDocuments(response.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDocuments(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDocuments]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadDocument(file);
      }
      await loadDocuments();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Sube PDFs y presentaciones PPTX. El motor RAG los indexará automáticamente en ChromaDB."
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`mb-8 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary-light/50"
            : "border-border bg-card"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-4xl" aria-hidden>
          📄
        </p>
        <p className="mt-3 text-sm font-medium text-foreground">
          Arrastra archivos aquí o selecciona desde tu equipo
        </p>
        <p className="mt-1 text-xs text-muted">
          PDF y PPTX · máximo 50 MB por archivo
        </p>
        <Button
          variant="secondary"
          className="mt-4"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "Subiendo..." : "Seleccionar archivos"}
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted">
            Aún no tienes documentos. Sube tu primer material académico para
            empezar.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="text-2xl" aria-hidden>
                  {doc.mime_type.includes("presentation") ? "📊" : "📕"}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {doc.title}
                  </p>
                  <p className="text-xs text-muted">
                    {doc.file_name} · {formatBytes(doc.file_size_bytes)}
                    {doc.page_count ? ` · ${doc.page_count} págs.` : ""}
                  </p>
                  <p className="text-xs text-muted">
                    Subido {formatDate(doc.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={statusVariants[doc.status]}>
                  {statusLabels[doc.status]}
                </Badge>
                <Button
                  variant="ghost"
                  className="text-error hover:bg-red-50"
                  onClick={() => handleDelete(doc.id)}
                >
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
