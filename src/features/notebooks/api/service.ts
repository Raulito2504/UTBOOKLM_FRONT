import { apiClient } from "@/src/lib/api/client";
import type {
  ChatMessage,
  ChatNotebook,
  CreateNotebookRequest,
  NotebookCard,
  NotebookDocument,
  RagGenerateResponse,
} from "../types";

export async function listNotebooks(limit = 24, offset = 0) {
  return apiClient<NotebookCard[]>(`/notebooks?limit=${limit}&offset=${offset}`);
}

export async function createNotebook(payload: CreateNotebookRequest) {
  return apiClient<ChatNotebook>("/notebooks", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      document_ids: payload.document_ids ?? [],
    }),
  });
}

export async function getNotebook(notebookId: string) {
  return apiClient<ChatNotebook>(`/notebooks/${notebookId}`);
}

export async function updateNotebookSources(
  notebookId: string,
  documentIds: string[],
) {
  return apiClient<ChatNotebook>(`/notebooks/${notebookId}/sources`, {
    method: "POST",
    body: JSON.stringify({ document_ids: documentIds }),
  });
}

export async function listNotebookSources(notebookId: string) {
  return apiClient<NotebookDocument[]>(`/notebooks/${notebookId}/sources`);
}

export async function removeNotebookSource(
  notebookId: string,
  documentId: string,
) {
  await apiClient<void>(`/notebooks/${notebookId}/sources/${documentId}`, {
    method: "DELETE",
  });
}

export async function uploadNotebookSource(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient<NotebookDocument>("/docs", {
    method: "POST",
    body: formData,
  });
}

export async function listNotebookMessages(notebookId: string) {
  return apiClient<ChatMessage[]>(`/notebooks/${notebookId}/messages`);
}

export async function sendNotebookMessage(notebookId: string, content: string) {
  return apiClient<RagGenerateResponse>(`/notebooks/${notebookId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function deleteNotebook(notebookId: string) {
  await apiClient<void>(`/notebooks/${notebookId}`, { method: "DELETE" });
}
