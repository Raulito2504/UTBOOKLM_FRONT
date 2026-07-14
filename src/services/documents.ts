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
  return apiClient<DocumentListResponse>(
    `/docs?page=${page}&page_size=${pageSize}`,
  );
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
  return apiClient<UploadDocumentResponse>("/docs/upload", {
    method: "POST",
    body: formData,
  });
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
  return apiClient<Document>(`/docs/${id}`);
}
