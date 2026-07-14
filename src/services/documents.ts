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

interface BackendDocumentListResponse {
  items: Document[];
  total: number;
  limit: number;
  offset: number;
}

interface BackendDocumentUploadResponse {
  document: Document;
  ingestion_job: {
    id: string;
    status: string;
  };
}

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
  const response = await apiClient<BackendDocumentListResponse>(
    `/docs?limit=${pageSize}&offset=${offset}`,
  );
  return {
    items: response.items,
    total: response.total,
    page,
    page_size: response.limit,
  };
}

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
  const response = await apiClient<BackendDocumentUploadResponse>("/docs/upload", {
    method: "POST",
    body: formData,
  });

  return {
    id: response.document.id,
    status: response.document.status,
    message: `Documento ${response.ingestion_job.status}`,
  };
}

export async function deleteDocument(id: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await delay(200);
    removeMockDocument(id);
    return;
  }
  await apiClient<void>(`/docs/${id}`, { method: "DELETE" });
}

export async function getDocument(id: string): Promise<Document> {
  if (USE_MOCK_DATA) {
    await delay(200);
    const doc = getMockDocuments().find((d) => d.id === id);
    if (!doc) throw new Error("Documento no encontrado");
    return doc;
  }
  const response = await apiClient<{ document: Document } | Document>(`/docs/${id}`);
  return "document" in response ? response.document : response;
}
