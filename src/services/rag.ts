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
  RagSource,
} from "@/src/types/rag";

interface ChatResponse {
  id: string;
  title: string;
  document_ids: string[];
  created_at: string;
  updated_at: string;
}

interface RagGenerateResponse {
  user_message: {
    id: string;
    content: string;
    created_at: string;
  };
  assistant_message: {
    id: string;
    content: string;
    created_at: string;
  };
  sources: Array<{
    document_id: string;
    chunk_id: string;
    page_number: number | null;
    preview: string;
  }>;
}

export async function submitRagQuery(
  request: RagQueryRequest,
): Promise<RagQuery> {
  if (USE_MOCK_DATA) {
    await delay(1200);
    return mockRagQuery(request);
  }

  const chat = await apiClient<ChatResponse>("/rag/chats", {
    method: "POST",
    body: JSON.stringify({
      title: request.question.slice(0, 80),
      document_ids: request.doc_ids,
    }),
  });
  const response = await apiClient<RagGenerateResponse>(`/rag/chats/${chat.id}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: request.question }),
  });

  return toRagQuery(chat, response);
}

export async function getRagHistory(): Promise<RagHistoryResponse> {
  if (USE_MOCK_DATA) {
    await delay(250);
    const items = getMockRagHistory();
    return { items, total: items.length };
  }

  const chats = await apiClient<ChatResponse[]>("/rag/chats?limit=20&offset=0");
  const items = await Promise.all(chats.map(chatToHistoryItem));
  return { items: items.filter(Boolean) as RagQuery[], total: items.length };
}

export async function summarizeDocuments(docIds: string[]): Promise<{ summary: string }> {
  if (USE_MOCK_DATA) {
    await delay(1500);
    return {
      summary:
        "Resumen simulado: los documentos seleccionados cubren temas de grafos, normalización de bases de datos y patrones de diseño.",
    };
  }

  const result = await submitRagQuery({
    doc_ids: docIds,
    question: "Genera un resumen claro y breve de los documentos seleccionados, organizado por temas principales.",
  });
  return { summary: result.answer };
}

async function chatToHistoryItem(chat: ChatResponse): Promise<RagQuery | null> {
  const messages = await apiClient<Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    sources: { items?: RagSource[] } | null;
    created_at: string;
  }>>(`/rag/chats/${chat.id}/messages`);
  const userMessage = [...messages].reverse().find((message) => message.role === "user");
  const assistantMessage = [...messages].reverse().find((message) => message.role === "assistant");
  if (!userMessage || !assistantMessage) return null;
  return {
    id: assistantMessage.id,
    question: userMessage.content,
    answer: assistantMessage.content,
    sources: assistantMessage.sources?.items ?? [],
    doc_ids: chat.document_ids,
    created_at: assistantMessage.created_at,
  };
}

function toRagQuery(chat: ChatResponse, response: RagGenerateResponse): RagQuery {
  return {
    id: response.assistant_message.id,
    question: response.user_message.content,
    answer: response.assistant_message.content,
    sources: response.sources.map((source) => ({
      chunk_id: source.chunk_id,
      document_id: source.document_id,
      document_title: "Documento fuente",
      page: source.page_number ?? 0,
      excerpt: source.preview,
    })),
    doc_ids: chat.document_ids,
    created_at: response.assistant_message.created_at,
  };
}
