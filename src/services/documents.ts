import { apiClient } from "@/src/lib/api/client";
import { USE_MOCK_DATA } from "@/src/lib/api/config";
import {
  addMockDocument,
  getMockDocuments,
  removeMockDocument,
} from "@/src/lib/mock/documents";
import { delay } from "@/src/lib/utils/delay";
import type {
  Document,
  DocumentListResponse,
  UploadDocumentResponse,
} from "@/src/types/documents";

interface ApiDocument {
  id: string;
  title: string;
  file_path: string;
  original_filename: string | null;
  mime_type: string | null;
  storage_backend: string;
  file_size_bytes: number;
  status: "processing" | "ready" | "failed";
  page_count: number;
  chunk_count?: number | null;
  created_at: string;
}

function toDocument(document: ApiDocument): Document {
  return {
    id: document.id,
    title: document.title,
    file_name: document.original_filename ?? document.title,
    mime_type: document.mime_type ?? "application/octet-stream",
    file_size_bytes: document.file_size_bytes,
    status: document.status === "failed" ? "error" : document.status,
    page_count: document.page_count,
    created_at: document.created_at,
    updated_at: document.created_at,
  };
}

/** GET /api/v1/docs */
export async function listDocuments(
  page = 1,
  pageSize = 20,
): Promise<DocumentListResponse> {
  if (USE_MOCK_DATA) {
    await delay(250);
    const items = getMockDocuments();
    return { items, total: items.length, page, page_size: pageSize };
  }
  const offset = (page - 1) * pageSize;
  const response = await apiClient<{ items: ApiDocument[]; total: number }>(
    `/docs/?limit=${pageSize}&offset=${offset}`,
  );
  return { items: response.items.map(toDocument), total: response.total, page, page_size: pageSize };
}

/** POST /api/v1/docs/upload */
export async function uploadDocument(
  file: File,
): Promise<UploadDocumentResponse> {
  if (USE_MOCK_DATA) {
    await delay(800);
    const doc = addMockDocument(file);
    return {
      id: doc.id,
      status: doc.status,
      message: "Documento en cola de indexado",
    };
  }

  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient<{ document: ApiDocument; ingestion_job: { status: string } }>("/docs/upload", {
    method: "POST",
    body: formData,
  });
  return {
    id: response.document.id,
    status: response.document.status === "failed" ? "error" : response.document.status,
    message: `Documento ${response.ingestion_job.status}`,
  };
}

/** DELETE /api/v1/docs/:doc_id */
export async function deleteDocument(id: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await delay(200);
    removeMockDocument(id);
    return;
  }
  await apiClient<void>(`/docs/${id}`, { method: "DELETE" });
}

/** GET /api/v1/docs/:doc_id */
export async function getDocument(id: string): Promise<Document> {
  if (USE_MOCK_DATA) {
    await delay(200);
    const doc = getMockDocuments().find((d) => d.id === id);
    if (!doc) throw new Error("Documento no encontrado");
    return doc;
  }
  const response = await apiClient<{ document: ApiDocument }>(`/docs/${id}`);
  return toDocument(response.document);
}
