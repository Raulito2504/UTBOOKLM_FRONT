import { apiClient } from "@/src/lib/api/client";
import { USE_MOCK_DATA } from "@/src/lib/api/config";
import {
  getMockRagHistory,
  mockRagQuery,
} from "@/src/lib/mock/rag";
import { delay } from "@/src/lib/utils/delay";
import type {
  RagHistoryResponse,
  RagQuery,
  RagQueryRequest,
} from "@/src/types/rag";

/** POST /api/v1/rag/query */
export async function submitRagQuery(
  request: RagQueryRequest,
): Promise<RagQuery> {
  if (USE_MOCK_DATA) {
    await delay(1200);
    return mockRagQuery(request);
  }
  return apiClient<RagQuery>("/rag/query", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/** GET /api/v1/rag/history */
export async function getRagHistory(): Promise<RagHistoryResponse> {
  if (USE_MOCK_DATA) {
    await delay(250);
    const items = getMockRagHistory();
    return { items, total: items.length };
  }
  return apiClient<RagHistoryResponse>("/rag/history");
}

/** POST /api/v1/rag/summarize */
export async function summarizeDocuments(docIds: string[]): Promise<{ summary: string }> {
  if (USE_MOCK_DATA) {
    await delay(1500);
    return {
      summary:
        "Resumen simulado: los documentos seleccionados cubren temas de grafos, normalización de bases de datos y patrones de diseño. Cuando el backend esté listo, recibirás un resumen estructurado por capítulo o tema.",
    };
  }
  return apiClient<{ summary: string }>("/rag/summarize", {
    method: "POST",
    body: JSON.stringify({ doc_ids: docIds }),
  });
}
