import { apiClient } from "@/src/lib/api/client";
import type { FlashcardCard, FlashcardDeck, GenerateFlashcardsRequest, GenerateQuizRequest, Quiz, QuizAttempt, QuizQuestion } from "../types";

export const listFlashcardDecks = () => apiClient<FlashcardDeck[]>("/flashcards/decks");
export const generateFlashcardDeck = (payload: GenerateFlashcardsRequest) => apiClient<FlashcardDeck>("/flashcards/generate", { method: "POST", body: JSON.stringify(payload) });
export const listDeckCards = (deckId: string) => apiClient<FlashcardCard[]>(`/flashcards/decks/${deckId}/cards`);
export const reviewFlashcard = (cardId: string, remembered: boolean) => apiClient<void>(`/flashcards/${cardId}/reviews`, { method: "POST", body: JSON.stringify({ remembered }) });
export const listQuizzes = () => apiClient<Quiz[]>("/quizzes");
export const generateQuiz = (payload: GenerateQuizRequest) => apiClient<Quiz>("/quizzes/generate", { method: "POST", body: JSON.stringify(payload) });
export const listQuizQuestions = (quizId: string) => apiClient<QuizQuestion[]>(`/quizzes/${quizId}/questions`);
export const submitQuizAnswers = (quizId: string, answers: Record<string, string>) => apiClient<QuizAttempt>(`/quizzes/${quizId}/answers`, { method: "POST", body: JSON.stringify({ answers }) });
