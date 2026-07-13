import { apiClient } from "@/src/lib/api/client";
import { USE_MOCK_DATA } from "@/src/lib/api/config";
import { delay } from "@/src/lib/utils/delay";
import type {
  FlashcardCard,
  FlashcardDeck,
  GenerateFlashcardsRequest,
  GenerateQuizRequest,
  Quiz,
  QuizAttempt,
  QuizQuestion,
} from "../types";

const mockDecks: FlashcardDeck[] = [];
const mockCardsByDeck = new Map<string, FlashcardCard[]>();
const mockQuizzes: Quiz[] = [];
const mockQuestionsByQuiz = new Map<string, QuizQuestion[]>();
const mockAttemptsByQuiz = new Map<string, QuizAttempt[]>();

export async function listFlashcardDecks() {
  if (USE_MOCK_DATA) {
    await delay(200);
    return [...mockDecks];
  }
  return apiClient<FlashcardDeck[]>("/flashcards/decks");
}

export async function generateFlashcardDeck(payload: GenerateFlashcardsRequest) {
  if (USE_MOCK_DATA) {
    await delay(800);
    const deck: FlashcardDeck = {
      id: `deck_${Date.now()}`,
      name: payload.deck_name || "Flashcards generadas",
      document_id: payload.document_ids.length === 1 ? payload.document_ids[0] : null,
      document_ids: payload.document_ids,
      notebook_id: payload.notebook_id ?? null,
      card_count: payload.count,
      created_at: new Date().toISOString(),
    };
    const cards = Array.from({ length: payload.count }, (_, index) => ({
      id: `card_${Date.now()}_${index}`,
      deck_id: deck.id,
      question: `Pregunta de estudio ${index + 1}`,
      answer: "Respuesta generada desde el documento seleccionado.",
      difficulty: payload.difficulty,
      created_at: deck.created_at,
    }));
    mockDecks.unshift(deck);
    mockCardsByDeck.set(deck.id, cards);
    return deck;
  }
  return apiClient<FlashcardDeck>("/flashcards/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listDeckCards(deckId: string) {
  if (USE_MOCK_DATA) {
    await delay(200);
    return [...(mockCardsByDeck.get(deckId) ?? [])];
  }
  return apiClient<FlashcardCard[]>(`/flashcards/decks/${deckId}/cards`);
}

export async function reviewFlashcard(cardId: string, remembered: boolean) {
  if (USE_MOCK_DATA) {
    await delay(100);
    return;
  }
  await apiClient<void>(`/flashcards/${cardId}/reviews`, {
    method: "POST",
    body: JSON.stringify({ remembered }),
  });
}

export async function listQuizzes() {
  if (USE_MOCK_DATA) {
    await delay(200);
    return [...mockQuizzes];
  }
  return apiClient<Quiz[]>("/quizzes");
}

export async function generateQuiz(payload: GenerateQuizRequest) {
  if (USE_MOCK_DATA) {
    await delay(900);
    const quiz: Quiz = {
      id: `quiz_${Date.now()}`,
      title: payload.title || "Quiz generado",
      document_id: payload.document_ids.length === 1 ? payload.document_ids[0] : null,
      document_ids: payload.document_ids,
      notebook_id: payload.notebook_id ?? null,
      created_at: new Date().toISOString(),
    };
    const questions = Array.from({ length: payload.question_count }, (_, index) => {
      const type = payload.question_types[index % payload.question_types.length];
      return {
        id: `question_${Date.now()}_${index}`,
        exam_id: quiz.id,
        question_type: type,
        prompt: `Pregunta ${index + 1} generada desde tus documentos`,
        options:
          type === "multiple_choice"
            ? { A: "Opcion A", B: "Opcion B", C: "Opcion C", D: "Opcion D" }
            : null,
        created_at: quiz.created_at,
      } satisfies QuizQuestion;
    });
    mockQuizzes.unshift(quiz);
    mockQuestionsByQuiz.set(quiz.id, questions);
    return quiz;
  }
  return apiClient<Quiz>("/quizzes/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listQuizQuestions(quizId: string) {
  if (USE_MOCK_DATA) {
    await delay(200);
    return [...(mockQuestionsByQuiz.get(quizId) ?? [])];
  }
  return apiClient<QuizQuestion[]>(`/quizzes/${quizId}/questions`);
}

export async function submitQuizAnswers(
  quizId: string,
  answers: Record<string, string>,
) {
  if (USE_MOCK_DATA) {
    await delay(400);
    const attempt: QuizAttempt = {
      id: `attempt_${Date.now()}`,
      exam_id: quizId,
      user_id: "mock-user",
      answers,
      score: 80,
      feedback: { items: [] },
      created_at: new Date().toISOString(),
    };
    mockAttemptsByQuiz.set(quizId, [attempt, ...(mockAttemptsByQuiz.get(quizId) ?? [])]);
    return attempt;
  }
  return apiClient<QuizAttempt>(`/quizzes/${quizId}/answers`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}
