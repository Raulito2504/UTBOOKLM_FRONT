export type DocumentStatus = "processing" | "ready" | "error";

export interface Document {
  id: string;
  title: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  status: DocumentStatus;
  page_count: number | null;
  created_at: string;
  updated_at: string;
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
