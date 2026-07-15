export interface NotebookCard { id: string; title: string; source_count: number; created_at: string; updated_at: string }
export interface ChatNotebook { id: string; user_id: string; organization_id: string; title: string; document_ids: string[]; created_at: string; updated_at: string }
export interface CreateNotebookRequest { title: string; document_ids?: string[] }
export interface NotebookDocument { id: string; title: string; file_path?: string; original_filename: string | null; mime_type: string | null; storage_backend?: string; file_size_bytes: number; page_count: number; chunk_count?: number | null; status: "processing" | "ready" | "failed"; created_at: string }
export interface RagSource { document_id: string; chunk_id: string; page_number: number | null; score: number | null; preview: string }
export interface ChatMessage { id: string; chat_session_id: string; role: "user" | "assistant"; content: string; sources: Record<string, unknown> | null; tokens_used: number | null; created_at: string }
export interface RagGenerateResponse { user_message: ChatMessage; assistant_message: ChatMessage; sources: RagSource[] }
