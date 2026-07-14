export type DocumentStatus = "processing" | "ready" | "failed";

export interface Document {
  id: string;
  title: string;
  file_path: string;
  original_filename: string | null;
  mime_type: string | null;
  storage_backend: string;
  file_size_bytes: number;
  status: DocumentStatus;
  page_count: number;
  created_at: string;
}

export interface DocumentListResponse {
  items: Document[];
  total: number;
  page: number;
  page_size: number;
}

export interface UploadDocumentResponse {
  id: string;
  status: DocumentStatus;
  message: string;
}
