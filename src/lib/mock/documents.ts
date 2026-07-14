import type { Document } from "@/src/types/documents";

export const mockDocuments: Document[] = [
  {
    id: "doc_001",
    title: "Matematicas Discretas - Cap. 4",
    file_path: "mock/matematicas-discretas-cap4.pdf",
    original_filename: "matematicas-discretas-cap4.pdf",
    mime_type: "application/pdf",
    storage_backend: "mock",
    file_size_bytes: 2_450_000,
    status: "ready",
    page_count: 48,
    created_at: "2026-06-10T14:00:00Z",
  },
  {
    id: "doc_002",
    title: "Bases de Datos - Unidad 3",
    file_path: "mock/bd-unidad3-normalizacion.pdf",
    original_filename: "bd-unidad3-normalizacion.pdf",
    mime_type: "application/pdf",
    storage_backend: "mock",
    file_size_bytes: 1_820_000,
    status: "ready",
    page_count: 32,
    created_at: "2026-06-15T09:30:00Z",
  },
  {
    id: "doc_003",
    title: "Ingenieria de Software - Patrones",
    file_path: "mock/is-patrones-diseno.pptx",
    original_filename: "is-patrones-diseno.pptx",
    mime_type:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    storage_backend: "mock",
    file_size_bytes: 3_100_000,
    status: "ready",
    page_count: 24,
    created_at: "2026-06-20T16:00:00Z",
  },
  {
    id: "doc_004",
    title: "Proyecto UTBookLM - Arquitectura",
    file_path: "mock/utbooklm-arquitectura.pdf",
    original_filename: "utbooklm-arquitectura.pdf",
    mime_type: "application/pdf",
    storage_backend: "mock",
    file_size_bytes: 980_000,
    status: "processing",
    page_count: 0,
    created_at: "2026-06-29T08:00:00Z",
  },
];

let documentsStore = [...mockDocuments];

export function getMockDocuments(): Document[] {
  return [...documentsStore];
}

export function addMockDocument(file: File): Document {
  const doc: Document = {
    id: `doc_${Date.now()}`,
    title: file.name.replace(/\.[^.]+$/, ""),
    file_path: `mock/${file.name}`,
    original_filename: file.name,
    mime_type: file.type || "application/pdf",
    storage_backend: "mock",
    file_size_bytes: file.size,
    status: "processing",
    page_count: 0,
    created_at: new Date().toISOString(),
  };
  documentsStore = [doc, ...documentsStore];
  return doc;
}

export function removeMockDocument(id: string): boolean {
  const before = documentsStore.length;
  documentsStore = documentsStore.filter((d) => d.id !== id);
  return documentsStore.length < before;
}

export function getMockReadyDocuments(): Document[] {
  return documentsStore.filter((d) => d.status === "ready");
}
