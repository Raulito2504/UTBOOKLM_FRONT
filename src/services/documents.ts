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
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: number;
  status: "processing" | "ready" | "failed";
  page_count: number | null;
  created_at: string;
  updated_at?: string;
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
    updated_at: document.updated_at ?? document.created_at,
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
  const items = await apiClient<ApiDocument[]>(`/docs?limit=${pageSize}&offset=${offset}`);
  return { items: items.map(toDocument), total: items.length, page, page_size: pageSize };
}

/** POST /api/v1/docs */
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
  const document = await apiClient<ApiDocument>("/docs", {
    method: "POST",
    body: formData,
  });
  return {
    id: document.id,
    status: document.status === "failed" ? "error" : document.status,
    message: "Documento listo para usarse",
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
  return toDocument(await apiClient<ApiDocument>(`/docs/${id}`));
}
