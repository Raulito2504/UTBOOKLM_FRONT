export interface RagSource {
  chunk_id: string;
  document_title: string;
  page: number;
  excerpt: string;
}

export interface RagQuery {
  id: string;
  question: string;
  answer: string;
  sources: RagSource[];
  doc_ids: string[];
  created_at: string;
}

export interface RagQueryRequest {
  question: string;
  doc_ids: string[];
}

export interface RagHistoryResponse {
  items: RagQuery[];
  total: number;
}
