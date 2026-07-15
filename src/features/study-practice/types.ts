export type FlashcardDifficulty = "easy" | "medium" | "hard";
export type QuizQuestionType = "multiple_choice" | "true_false" | "open";
export interface FlashcardDeck { id: string; name: string; document_id: string | null; document_ids?: string[]; notebook_id?: string | null; card_count: number; created_at: string }
export interface FlashcardCard { id: string; deck_id: string; question: string; answer: string; difficulty: FlashcardDifficulty; created_at: string }
export interface GenerateFlashcardsRequest { document_ids: string[]; notebook_id?: string; count: number; difficulty: FlashcardDifficulty; deck_name?: string }
export interface Quiz { id: string; title: string; document_id: string | null; document_ids?: string[]; notebook_id?: string | null; created_at: string }
export interface QuizQuestion { id: string; exam_id: string; question_type: QuizQuestionType; prompt: string; options: Record<string, string> | null; created_at: string }
export interface GenerateQuizRequest { document_ids: string[]; notebook_id?: string; title?: string; question_count: number; question_types: QuizQuestionType[] }
export interface QuizAttempt { id: string; exam_id: string; user_id: string; answers: Record<string, string>; score: number | null; feedback: { items?: Array<{ question_id: string; submitted_answer: string | null; correct_answer: string | null; is_correct: boolean | null; explanation: string | null }> } | null; created_at: string }
