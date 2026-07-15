import { USE_MOCK_DATA } from "@/src/lib/api/config";
import {
  generateMockFlashcards,
  getMockExamDetail,
  getMockExams,
  getMockFlashcards,
} from "@/src/lib/mock/flashcards";
import { delay } from "@/src/lib/utils/delay";
import {
  generateFlashcardDeck,
  generateQuiz,
  listDeckCards,
  listFlashcardDecks,
  listQuizQuestions,
  listQuizzes,
  reviewFlashcard as reviewDeckFlashcard,
} from "@/src/features/study-practice/api/service";
import type { FlashcardCard, FlashcardDeck, QuizQuestionType } from "@/src/features/study-practice/types";
import type {
  ExamDetail,
  ExamSummary,
  Flashcard,
  FlashcardListResponse,
  GenerateFlashcardsRequest,
  ReviewResult,
} from "@/src/types/flashcards";

function toFlashcard(card: FlashcardCard, deck: FlashcardDeck): Flashcard {
  const type: Flashcard["type"] = card.difficulty === "easy" ? "definition" : card.difficulty === "hard" ? "application" : "concept";
  return {
    id: card.id,
    front: card.question,
    back: card.answer,
    doc_id: deck.document_id ?? deck.id,
    doc_title: deck.name,
    type,
    created_at: card.created_at,
  };
}

function toExamType(type: QuizQuestionType): ExamSummary["types"][number] {
  return type === "multiple_choice" ? "mcq" : type;
}

/** GET /api/v1/flashcards/decks y sus tarjetas */
export async function listFlashcards(): Promise<FlashcardListResponse> {
  if (USE_MOCK_DATA) {
    await delay(250);
    const items = getMockFlashcards();
    return { items, total: items.length };
  }
  const decks = await listFlashcardDecks();
  const cardsByDeck = await Promise.all(decks.map(async (deck) => ({ deck, cards: await listDeckCards(deck.id) })));
  const items = cardsByDeck.flatMap(({ deck, cards }) => cards.map((card) => toFlashcard(card, deck)));
  return { items, total: items.length };
}

/** POST /api/v1/flashcards/generate */
export async function generateFlashcards(
  request: GenerateFlashcardsRequest,
): Promise<Flashcard[]> {
  if (USE_MOCK_DATA) {
    await delay(1500);
    return generateMockFlashcards(request);
  }
  const difficulty = request.type === "definition" ? "easy" : request.type === "application" ? "hard" : "medium";
  const deck = await generateFlashcardDeck({ document_ids: request.doc_ids, count: request.count, difficulty });
  const cards = await listDeckCards(deck.id);
  return cards.map((card) => toFlashcard(card, deck));
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
  await reviewDeckFlashcard(id, result === "correct");
}

/** POST /api/v1/quizzes/generate */
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
  const quiz = await generateQuiz({
    document_ids: docIds,
    question_count: 10,
    question_types: ["multiple_choice", "true_false", "open"],
  });
  const questions = await listQuizQuestions(quiz.id);
  return {
    id: quiz.id,
    title: quiz.title,
    doc_title: quiz.title,
    question_count: questions.length,
    types: [...new Set(questions.map((question) => toExamType(question.question_type)))],
    created_at: quiz.created_at,
  };
}

/** GET /api/v1/quizzes/:id/questions */
export async function getExamDetail(id: string): Promise<ExamDetail | null> {
  if (USE_MOCK_DATA) {
    await delay(300);
    return getMockExamDetail(id) ?? getMockExams()[0]
      ? getMockExamDetail(getMockExams()[0].id)
      : null;
  }
  const [quiz, questions] = await Promise.all([
    listQuizzes().then((items) => items.find((item) => item.id === id)),
    listQuizQuestions(id),
  ]);
  if (!quiz) return null;
  return {
    id: quiz.id,
    title: quiz.title,
    doc_title: quiz.title,
    question_count: questions.length,
    types: [...new Set(questions.map((question) => toExamType(question.question_type)))],
    created_at: quiz.created_at,
    questions: questions.map((question) => ({
      id: question.id,
      type: toExamType(question.question_type),
      prompt: question.prompt,
      options: question.options ? Object.values(question.options) : undefined,
    })),
  };
}

/** GET /api/v1/quizzes y sus preguntas */
export async function listExams(): Promise<ExamSummary[]> {
  if (USE_MOCK_DATA) {
    await delay(250);
    return getMockExams();
  }
  const quizzes = await listQuizzes();
  return Promise.all(quizzes.map(async (quiz) => {
    const questions = await listQuizQuestions(quiz.id);
    return {
      id: quiz.id,
      title: quiz.title,
      doc_title: quiz.title,
      question_count: questions.length,
      types: [...new Set(questions.map((question) => toExamType(question.question_type)))],
      created_at: quiz.created_at,
    };
  }));
}
