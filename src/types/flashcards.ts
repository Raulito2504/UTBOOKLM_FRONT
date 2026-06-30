export type FlashcardType = "definition" | "concept" | "application";
export type ReviewResult = "correct" | "incorrect" | "skip";
export type ExamQuestionType = "mcq" | "true_false" | "open";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  doc_id: string;
  doc_title: string;
  type: FlashcardType;
  created_at: string;
}

export interface FlashcardListResponse {
  items: Flashcard[];
  total: number;
}

export interface GenerateFlashcardsRequest {
  doc_ids: string[];
  type: FlashcardType;
  count: number;
}

export interface ExamSummary {
  id: string;
  title: string;
  doc_title: string;
  question_count: number;
  types: ExamQuestionType[];
  created_at: string;
}

export interface ExamQuestion {
  id: string;
  type: ExamQuestionType;
  prompt: string;
  options?: string[];
  correct_answer?: string;
}

export interface ExamDetail extends ExamSummary {
  questions: ExamQuestion[];
}
