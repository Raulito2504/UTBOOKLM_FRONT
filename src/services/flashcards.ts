import { ApiError, apiClient } from "@/src/lib/api/client";
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

type FlashcardDifficulty = "easy" | "medium" | "hard";

interface BackendDeck {
  id: string;
  name: string;
  document_id: string | null;
  document_ids: string[];
  card_count: number;
  created_at: string;
}

interface BackendCard {
  id: string;
  deck_id: string;
  question: string;
  answer: string;
  difficulty: FlashcardDifficulty;
  created_at: string;
}

interface BackendQuiz {
  id: string;
  title: string;
  document_id: string | null;
  document_ids: string[];
  created_at: string;
}

interface BackendQuizQuestion {
  id: string;
  question_type: "multiple_choice" | "true_false" | "open";
  prompt: string;
  options: Record<string, string> | null;
}

export async function listFlashcards(): Promise<FlashcardListResponse> {
  if (USE_MOCK_DATA) {
    await delay(250);
    const items = getMockFlashcards();
    return { items, total: items.length };
  }

  const decks = await apiClient<BackendDeck[]>("/flashcards/decks");
  const groups = await Promise.all(
    decks.map(async (deck) => {
      const cards = await apiClient<BackendCard[]>(`/flashcards/decks/${deck.id}/cards`);
      return cards.map((card) => toFlashcard(card, deck));
    }),
  );
  const items = groups.flat();
  return { items, total: items.length };
}

export async function generateFlashcards(
  request: GenerateFlashcardsRequest,
): Promise<Flashcard[]> {
  if (USE_MOCK_DATA) {
    await delay(1500);
    return generateMockFlashcards(request);
  }

  const deck = await apiClient<BackendDeck>("/flashcards/generate", {
    method: "POST",
    body: JSON.stringify({
      document_ids: request.doc_ids,
      count: request.count,
      difficulty: "medium",
      deck_name: deckName(request.type),
    }),
  });
  const cards = await apiClient<BackendCard[]>(`/flashcards/decks/${deck.id}/cards`);
  return cards.map((card) => toFlashcard(card, deck));
}

export async function deleteFlashcard(id: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await delay(200);
    removeMockFlashcard(id);
    return;
  }

  try {
    await apiClient<void>(`/flashcards/${id}`, { method: "DELETE" });
  } catch (error) {
    if (!(error instanceof ApiError) || ![404, 405].includes(error.status)) {
      throw error;
    }
  }
}

export async function reviewFlashcard(
  id: string,
  result: ReviewResult,
): Promise<void> {
  if (USE_MOCK_DATA) {
    await delay(100);
    return;
  }
  await apiClient<void>(`/flashcards/${id}/reviews`, {
    method: "POST",
    body: JSON.stringify({ remembered: result === "correct" }),
  });
}

export async function generateExam(docIds: string[]): Promise<ExamSummary> {
  if (USE_MOCK_DATA) {
    await delay(1500);
    return {
      id: `exam_${Date.now()}`,
      title: "Examen generado",
      doc_title: "Documento seleccionado",
      question_count: 10,
      types: ["multiple_choice", "true_false", "open"],
      created_at: new Date().toISOString(),
    };
  }
  const quiz = await apiClient<BackendQuiz>("/quizzes/generate", {
    method: "POST",
    body: JSON.stringify({
      document_ids: docIds,
      question_count: 10,
      question_types: ["multiple_choice", "true_false", "open"],
    }),
  });
  return toExamSummary(quiz, 10);
}

export async function getExamDetail(id: string): Promise<ExamDetail | null> {
  if (USE_MOCK_DATA) {
    await delay(300);
    return getMockExamDetail(id) ?? getMockExams()[0]
      ? getMockExamDetail(getMockExams()[0].id)
      : null;
  }
  const [quiz, questions] = await Promise.all([
    apiClient<BackendQuiz>(`/quizzes/${id}`),
    apiClient<BackendQuizQuestion[]>(`/quizzes/${id}/questions`),
  ]);
  return {
    ...toExamSummary(quiz, questions.length),
    questions: questions.map((question) => ({
      id: question.id,
      type: question.question_type,
      prompt: question.prompt,
      options: question.options ? Object.values(question.options) : undefined,
    })),
  };
}

export async function listExams(): Promise<ExamSummary[]> {
  if (USE_MOCK_DATA) {
    await delay(250);
    return getMockExams();
  }
  const quizzes = await apiClient<BackendQuiz[]>("/quizzes");
  return quizzes.map((quiz) => toExamSummary(quiz, 0));
}

function toFlashcard(card: BackendCard, deck: BackendDeck): Flashcard {
  return {
    id: card.id,
    front: card.question,
    back: card.answer,
    doc_id: deck.document_id ?? deck.document_ids[0] ?? "",
    doc_title: deck.name,
    type: "concept",
    created_at: card.created_at,
  };
}

function toExamSummary(quiz: BackendQuiz, questionCount: number): ExamSummary {
  return {
    id: quiz.id,
    title: quiz.title,
    doc_title: quiz.document_id ?? quiz.document_ids[0] ?? "Documentos seleccionados",
    question_count: questionCount,
    types: ["multiple_choice", "true_false", "open"],
    created_at: quiz.created_at,
  };
}

function deckName(type: GenerateFlashcardsRequest["type"]): string {
  if (type === "definition") return "Definiciones generadas";
  if (type === "application") return "Aplicaciones generadas";
  return "Conceptos generados";
}
