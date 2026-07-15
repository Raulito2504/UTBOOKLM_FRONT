import { apiClient } from "@/src/lib/api/client";
import type { ChatMessage, ChatNotebook, CreateNotebookRequest, NotebookCard, NotebookDocument, RagGenerateResponse } from "../types";

export const listNotebooks = (limit = 24, offset = 0) => apiClient<NotebookCard[]>(`/notebooks?limit=${limit}&offset=${offset}`);
export const createNotebook = (payload: CreateNotebookRequest) => apiClient<ChatNotebook>("/notebooks", { method: "POST", body: JSON.stringify({ title: payload.title, document_ids: payload.document_ids ?? [] }) });
export const getNotebook = (notebookId: string) => apiClient<ChatNotebook>(`/notebooks/${notebookId}`);
export const updateNotebookSources = (notebookId: string, documentIds: string[]) => apiClient<ChatNotebook>(`/notebooks/${notebookId}/sources`, { method: "POST", body: JSON.stringify({ document_ids: documentIds }) });
export const listNotebookSources = (notebookId: string) => apiClient<NotebookDocument[]>(`/notebooks/${notebookId}/sources`);
export const removeNotebookSource = (notebookId: string, documentId: string) => apiClient<void>(`/notebooks/${notebookId}/sources/${documentId}`, { method: "DELETE" });
export const listNotebookMessages = (notebookId: string) => apiClient<ChatMessage[]>(`/notebooks/${notebookId}/messages`);
export const sendNotebookMessage = (notebookId: string, content: string) => apiClient<RagGenerateResponse>(`/notebooks/${notebookId}/messages`, { method: "POST", body: JSON.stringify({ content }) });
export async function uploadNotebookSource(file: File) {
  const body = new FormData();
  body.append("file", file);
  const response = await apiClient<{ document: NotebookDocument }>("/docs/upload", { method: "POST", body });
  return response.document;
}
export const deleteNotebook = (notebookId: string) => apiClient<void>(`/notebooks/${notebookId}`, { method: "DELETE" });
