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

interface ApiChat {
  id: string;
  title: string;
  document_ids: string[];
  created_at: string;
}

interface ApiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ApiRagSource {
  chunk_id: string;
  document_id: string;
  page_number: number | null;
  preview: string;
}

interface ApiGenerateResponse {
  user_message: ApiMessage;
  assistant_message: ApiMessage;
  sources: ApiRagSource[];
}

function toRagQuery(chat: ApiChat, response: ApiGenerateResponse): RagQuery {
  return {
    id: chat.id,
    question: response.user_message.content,
    answer: response.assistant_message.content,
    sources: response.sources.map((source) => ({
      chunk_id: source.chunk_id,
      document_title: `Documento ${source.document_id.slice(0, 8)}`,
      page: source.page_number ?? 0,
      excerpt: source.preview,
    })),
    doc_ids: chat.document_ids,
    created_at: response.assistant_message.created_at,
  };
}

/** POST /api/v1/rag/query */
export async function submitRagQuery(
  request: RagQueryRequest,
): Promise<RagQuery> {
  if (USE_MOCK_DATA) {
    await delay(1200);
    return mockRagQuery(request);
  }
  const chat = await apiClient<ApiChat>("/rag/chats", {
    method: "POST",
    body: JSON.stringify({
      title: request.question.slice(0, 255),
      document_ids: request.doc_ids,
    }),
  });
  const response = await apiClient<ApiGenerateResponse>(`/rag/chats/${chat.id}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: request.question }),
  });
  return toRagQuery(chat, response);
}

/** GET /api/v1/rag/history */
export async function getRagHistory(): Promise<RagHistoryResponse> {
  if (USE_MOCK_DATA) {
    await delay(250);
    const items = getMockRagHistory();
    return { items, total: items.length };
  }
  const chats = await apiClient<ApiChat[]>("/rag/chats");
  const items: Array<RagQuery | null> = await Promise.all(chats.map(async (chat) => {
    const messages = await apiClient<ApiMessage[]>(`/rag/chats/${chat.id}/messages`);
    const assistantIndex = messages.map((message) => message.role).lastIndexOf("assistant");
    const assistant = messages[assistantIndex];
    const user = messages.slice(0, assistantIndex).reverse().find((message) => message.role === "user");
    if (!assistant || !user) return null;
    return {
      id: chat.id,
      question: user.content,
      answer: assistant.content,
      sources: [],
      doc_ids: chat.document_ids,
      created_at: assistant.created_at,
    };
  }));
  const history = items.filter((item): item is RagQuery => item !== null);
  return { items: history, total: history.length };
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
  const result = await submitRagQuery({
    question: "Genera un resumen claro y estructurado de los documentos seleccionados.",
    doc_ids: docIds,
  });
  return { summary: result.answer };
}
