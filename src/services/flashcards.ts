import { apiClient } from "@/src/lib/api/client";
import { USE_MOCK_DATA } from "@/src/lib/api/config";
import {
  generateMockFlashcards,
  getMockExamDetail,
  getMockExams,
  getMockFlashcards,
  removeMockFlashcard,
} from "@/src/lib/mock/flashcards";
import { delay } from "@/src/lib/utils/delay";
import type {
  ExamDetail,
  ExamSummary,
  Flashcard,
  FlashcardListResponse,
  GenerateFlashcardsRequest,
  ReviewResult,
} from "@/src/types/flashcards";

/** GET /api/v1/flashcards */
export async function listFlashcards(): Promise<FlashcardListResponse> {
  if (USE_MOCK_DATA) {
    await delay(250);
    const items = getMockFlashcards();
    return { items, total: items.length };
  }
  return apiClient<FlashcardListResponse>("/flashcards");
}

/** POST /api/v1/flashcards/generate */
export async function generateFlashcards(
  request: GenerateFlashcardsRequest,
): Promise<Flashcard[]> {
  if (USE_MOCK_DATA) {
    await delay(1500);
    return generateMockFlashcards(request);
  }
  return apiClient<Flashcard[]>("/flashcards/generate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/** DELETE /api/v1/flashcards/:id */
export async function deleteFlashcard(id: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await delay(200);
    removeMockFlashcard(id);
    return;
  }
  await apiClient<void>(`/flashcards/${id}`, { method: "DELETE" });
}

/** POST /api/v1/flashcards/:id/review */
export async function reviewFlashcard(
  id: string,
  result: ReviewResult,
): Promise<void> {
  if (USE_MOCK_DATA) {
    await delay(100);
    return;
  }
  await apiClient<void>(`/flashcards/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ result }),
  });
}

/** POST /api/v1/exams/generate */
export async function generateExam(docIds: string[]): Promise<ExamSummary> {
  if (USE_MOCK_DATA) {
    await delay(1500);
    return {
      id: `exam_${Date.now()}`,
      title: "Examen generado",
      doc_title: "Documento seleccionado",
      question_count: 10,
      types: ["mcq", "true_false", "open"],
      created_at: new Date().toISOString(),
    };
  }
  return apiClient<ExamSummary>("/exams/generate", {
    method: "POST",
    body: JSON.stringify({ doc_ids: docIds }),
  });
}

/** GET exam detail (mock only for now) */
export async function getExamDetail(id: string): Promise<ExamDetail | null> {
  if (USE_MOCK_DATA) {
    await delay(300);
    return getMockExamDetail(id) ?? getMockExams()[0]
      ? getMockExamDetail(getMockExams()[0].id)
      : null;
  }
  return apiClient<ExamDetail>(`/exams/${id}`);
}

/** GET /api/v1/exams list (via mock) */
export async function listExams(): Promise<ExamSummary[]> {
  if (USE_MOCK_DATA) {
    await delay(250);
    return getMockExams();
  }
  return apiClient<ExamSummary[]>("/exams");
}
