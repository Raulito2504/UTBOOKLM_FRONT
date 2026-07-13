"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { PageHeader } from "@/src/components/ui/page-header";
import { listDocuments } from "@/src/services/documents";
import type { Document } from "@/src/types/documents";
import {
  generateFlashcardDeck,
  generateQuiz,
  listDeckCards,
  listFlashcardDecks,
  listQuizQuestions,
  listQuizzes,
  reviewFlashcard,
  submitQuizAnswers,
} from "../api/service";
import type {
  FlashcardCard,
  FlashcardDeck,
  FlashcardDifficulty,
  Quiz,
  QuizAttempt,
  QuizQuestion,
  QuizQuestionType,
} from "../types";

type Tab = "flashcards" | "quizzes";

const difficultyLabels: Record<FlashcardDifficulty, string> = {
  easy: "Facil",
  medium: "Media",
  hard: "Dificil",
};

const questionTypeLabels: Record<QuizQuestionType, string> = {
  multiple_choice: "Opcion multiple",
  true_false: "Verdadero/Falso",
  open: "Abierta",
};

export function StudyPracticeView() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") === "quizzes" ? "quizzes" : "flashcards";
  const requestedDocumentsParam = searchParams.get("documents") ?? "";
  const requestedDocumentIds = useMemo(
    () =>
      requestedDocumentsParam
        .split(",")
        .map((documentId) => documentId.trim())
        .filter(Boolean),
    [requestedDocumentsParam],
  );

  const [tab, setTab] = useState<Tab>(requestedTab);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deckName, setDeckName] = useState("");
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [difficulty, setDifficulty] = useState<FlashcardDifficulty>("medium");
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  const [quizTitle, setQuizTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [questionTypes, setQuestionTypes] = useState<QuizQuestionType[]>([
    "multiple_choice",
  ]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  const eligibleDocuments = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.status === "ready" && Number(document.chunk_count ?? 0) > 0,
      ),
    [documents],
  );

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) ?? null;
  const selectedQuiz = quizzes.find((quiz) => quiz.id === selectedQuizId) ?? null;
  const reviewCard = cards[reviewIndex] ?? null;

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [documentList, deckList, quizList] = await Promise.all([
        listDocuments(1, 100),
        listFlashcardDecks(),
        listQuizzes(),
      ]);
      const readyDocuments = documentList.items.filter(
        (document) =>
          document.status === "ready" && Number(document.chunk_count ?? 0) > 0,
      );
      const readyDocumentIds = new Set(
        readyDocuments.map((document) => document.id),
      );
      const requestedReadyDocumentIds = requestedDocumentIds.filter((documentId) =>
        readyDocumentIds.has(documentId),
      );
      setDocuments(documentList.items);
      setDecks(deckList);
      setQuizzes(quizList);
      setSelectedDocumentIds((current) => {
        if (requestedReadyDocumentIds.length > 0) {
          return requestedReadyDocumentIds;
        }

        const stillEligible = current.filter((documentId) =>
          readyDocumentIds.has(documentId),
        );
        if (stillEligible.length > 0) {
          return stillEligible;
        }

        return readyDocuments[0] ? [readyDocuments[0].id] : [];
      });
      setSelectedDeckId((current) => current || deckList[0]?.id || "");
      setSelectedQuizId((current) => current || quizList[0]?.id || "");
    } catch {
      setError("No fue posible cargar la practica.");
    } finally {
      setLoading(false);
    }
  }, [requestedDocumentIds]);

  useEffect(() => {
    const timer = window.setTimeout(() => setTab(requestedTab), 0);
    return () => window.clearTimeout(timer);
  }, [requestedTab]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadInitialData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadInitialData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!selectedDeckId) {
        setCards([]);
        return;
      }
      void listDeckCards(selectedDeckId)
        .then((items) => {
          setCards(items);
          setReviewIndex(0);
          setIsFlipped(false);
        })
        .catch(() => setError("No fue posible cargar las flashcards."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedDeckId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!selectedQuizId) {
        setQuestions([]);
        setAnswers({});
        setLatestAttempt(null);
        return;
      }
      void listQuizQuestions(selectedQuizId)
        .then((items) => {
          setQuestions(items);
          setAnswers({});
          setLatestAttempt(null);
        })
        .catch(() => setError("No fue posible cargar el quiz."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedQuizId]);

  function toggleDocument(documentId: string) {
    setSelectedDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    );
  }

  function toggleQuestionType(type: QuizQuestionType) {
    setQuestionTypes((current) => {
      if (current.includes(type)) {
        return current.length === 1
          ? current
          : current.filter((item) => item !== type);
      }
      return [...current, type];
    });
  }

  async function handleGenerateDeck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedDocumentIds.length === 0) return;

    setIsGeneratingDeck(true);
    setError("");
    try {
      const deck = await generateFlashcardDeck({
        document_ids: selectedDocumentIds,
        count: flashcardCount,
        difficulty,
        deck_name: deckName.trim() || undefined,
      });
      const nextDecks = await listFlashcardDecks();
      setDecks(nextDecks);
      setSelectedDeckId(deck.id);
      setCards(await listDeckCards(deck.id));
      setDeckName("");
      setTab("flashcards");
    } catch {
      setError("No fue posible generar flashcards con esos documentos.");
    } finally {
      setIsGeneratingDeck(false);
    }
  }

  async function handleReview(remembered: boolean) {
    if (!reviewCard) return;
    await reviewFlashcard(reviewCard.id, remembered);
    setIsFlipped(false);
    if (reviewIndex < cards.length - 1) {
      setReviewIndex((current) => current + 1);
    } else {
      setIsReviewing(false);
      setReviewIndex(0);
    }
  }

  async function handleGenerateQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedDocumentIds.length === 0 || questionTypes.length === 0) return;

    setIsGeneratingQuiz(true);
    setError("");
    try {
      const quiz = await generateQuiz({
        document_ids: selectedDocumentIds,
        title: quizTitle.trim() || undefined,
        question_count: questionCount,
        question_types: questionTypes,
      });
      const nextQuizzes = await listQuizzes();
      setQuizzes(nextQuizzes);
      setSelectedQuizId(quiz.id);
      setQuestions(await listQuizQuestions(quiz.id));
      setQuizTitle("");
      setTab("quizzes");
    } catch {
      setError("No fue posible generar el quiz con esos documentos.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  }

  async function handleSubmitQuiz() {
    if (!selectedQuizId || Object.keys(answers).length === 0) return;

    setIsSubmittingQuiz(true);
    setError("");
    try {
      const attempt = await submitQuizAnswers(selectedQuizId, answers);
      setLatestAttempt(attempt);
    } catch {
      setError("No fue posible enviar tus respuestas.");
    } finally {
      setIsSubmittingQuiz(false);
    }
  }

  if (loading) {
    return <div className="h-96 animate-pulse rounded-lg bg-slate-200" />;
  }

  return (
    <div>
      <PageHeader
        title="Práctica"
        description="Genera flashcards y quizzes desde documentos listos para estudiar."
      />

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-6 flex gap-2 border-b border-border">
        {(["flashcards", "quizzes"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === item
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {item === "flashcards" ? "Flashcards" : "Quizzes"}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">
              Fuentes de estudio
            </h2>
            <div className="mt-4 space-y-2">
              {eligibleDocuments.length === 0 ? (
                <p className="text-sm text-muted">
                  Sube un documento listo con chunks para generar practica.
                </p>
              ) : (
                eligibleDocuments.map((document) => (
                  <label
                    key={document.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocumentIds.includes(document.id)}
                      onChange={() => toggleDocument(document.id)}
                      className="mt-1"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">
                        {document.title}
                      </span>
                      <span className="text-xs text-muted">
                        {document.chunk_count} chunks
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </section>

          {tab === "flashcards" ? (
            <FlashcardForm
              deckName={deckName}
              setDeckName={setDeckName}
              count={flashcardCount}
              setCount={setFlashcardCount}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              disabled={selectedDocumentIds.length === 0 || isGeneratingDeck}
              isGenerating={isGeneratingDeck}
              onSubmit={handleGenerateDeck}
            />
          ) : (
            <QuizForm
              title={quizTitle}
              setTitle={setQuizTitle}
              count={questionCount}
              setCount={setQuestionCount}
              questionTypes={questionTypes}
              toggleQuestionType={toggleQuestionType}
              disabled={selectedDocumentIds.length === 0 || isGeneratingQuiz}
              isGenerating={isGeneratingQuiz}
              onSubmit={handleGenerateQuiz}
            />
          )}
        </aside>

        {tab === "flashcards" ? (
          <FlashcardPanel
            decks={decks}
            selectedDeck={selectedDeck}
            selectedDeckId={selectedDeckId}
            setSelectedDeckId={setSelectedDeckId}
            cards={cards}
            isReviewing={isReviewing}
            setIsReviewing={setIsReviewing}
            reviewCard={reviewCard}
            reviewIndex={reviewIndex}
            isFlipped={isFlipped}
            setIsFlipped={setIsFlipped}
            handleReview={handleReview}
          />
        ) : (
          <QuizPanel
            quizzes={quizzes}
            selectedQuiz={selectedQuiz}
            selectedQuizId={selectedQuizId}
            setSelectedQuizId={setSelectedQuizId}
            questions={questions}
            answers={answers}
            setAnswers={setAnswers}
            latestAttempt={latestAttempt}
            isSubmitting={isSubmittingQuiz}
            onSubmit={handleSubmitQuiz}
          />
        )}
      </div>
    </div>
  );
}

interface FlashcardFormProps {
  deckName: string;
  setDeckName: (value: string) => void;
  count: number;
  setCount: (value: number) => void;
  difficulty: FlashcardDifficulty;
  setDifficulty: (value: FlashcardDifficulty) => void;
  disabled: boolean;
  isGenerating: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function FlashcardForm({
  deckName,
  setDeckName,
  count,
  setCount,
  difficulty,
  setDifficulty,
  disabled,
  isGenerating,
  onSubmit,
}: FlashcardFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-border bg-card p-5 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-foreground">
        Generar flashcards
      </h2>
      <div className="mt-4 space-y-4">
        <label className="block text-sm font-medium text-foreground">
          Nombre del mazo
          <input
            value={deckName}
            onChange={(event) => setDeckName(event.target.value)}
            placeholder="Opcional"
            className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Dificultad
          <select
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as FlashcardDifficulty)
            }
            className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            {Object.entries(difficultyLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-foreground">
          Cantidad
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          />
        </label>
        <Button type="submit" fullWidth disabled={disabled}>
          {isGenerating ? "Generando..." : "Generar flashcards"}
        </Button>
      </div>
    </form>
  );
}

interface QuizFormProps {
  title: string;
  setTitle: (value: string) => void;
  count: number;
  setCount: (value: number) => void;
  questionTypes: QuizQuestionType[];
  toggleQuestionType: (type: QuizQuestionType) => void;
  disabled: boolean;
  isGenerating: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function QuizForm({
  title,
  setTitle,
  count,
  setCount,
  questionTypes,
  toggleQuestionType,
  disabled,
  isGenerating,
  onSubmit,
}: QuizFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-border bg-card p-5 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-foreground">Generar quiz</h2>
      <div className="mt-4 space-y-4">
        <label className="block text-sm font-medium text-foreground">
          Titulo
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Opcional"
            className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Preguntas
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          />
        </label>
        <div>
          <p className="text-sm font-medium text-foreground">Tipos</p>
          <div className="mt-2 space-y-2">
            {(Object.keys(questionTypeLabels) as QuizQuestionType[]).map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={questionTypes.includes(type)}
                  onChange={() => toggleQuestionType(type)}
                />
                {questionTypeLabels[type]}
              </label>
            ))}
          </div>
        </div>
        <Button type="submit" fullWidth disabled={disabled}>
          {isGenerating ? "Generando..." : "Generar quiz"}
        </Button>
      </div>
    </form>
  );
}

interface FlashcardPanelProps {
  decks: FlashcardDeck[];
  selectedDeck: FlashcardDeck | null;
  selectedDeckId: string;
  setSelectedDeckId: (deckId: string) => void;
  cards: FlashcardCard[];
  isReviewing: boolean;
  setIsReviewing: (value: boolean) => void;
  reviewCard: FlashcardCard | null;
  reviewIndex: number;
  isFlipped: boolean;
  setIsFlipped: (value: boolean | ((current: boolean) => boolean)) => void;
  handleReview: (remembered: boolean) => Promise<void>;
}

function FlashcardPanel({
  decks,
  selectedDeck,
  selectedDeckId,
  setSelectedDeckId,
  cards,
  isReviewing,
  setIsReviewing,
  reviewCard,
  reviewIndex,
  isFlipped,
  setIsFlipped,
  handleReview,
}: FlashcardPanelProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Flashcards</h2>
          <p className="text-sm text-muted">
            {selectedDeck ? selectedDeck.name : "Selecciona o genera un mazo"}
          </p>
        </div>
        {cards.length > 0 ? (
          <Button
            variant="secondary"
            onClick={() => {
              setIsReviewing(!isReviewing);
              setIsFlipped(false);
            }}
          >
            {isReviewing ? "Ver lista" : "Iniciar repaso"}
          </Button>
        ) : null}
      </div>

      {decks.length > 0 ? (
        <select
          value={selectedDeckId}
          onChange={(event) => setSelectedDeckId(event.target.value)}
          className="mt-4 h-11 w-full max-w-md rounded-lg border border-border bg-card px-3 text-sm"
        >
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name} ({deck.card_count})
            </option>
          ))}
        </select>
      ) : null}

      {cards.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          Aun no hay tarjetas para mostrar.
        </div>
      ) : isReviewing && reviewCard ? (
        <div className="mx-auto mt-6 max-w-xl">
          <p className="mb-3 text-sm text-muted">
            Tarjeta {reviewIndex + 1} de {cards.length}
          </p>
          <button
            type="button"
            onClick={() => setIsFlipped((current) => !current)}
            className="flex min-h-60 w-full flex-col items-center justify-center rounded-lg border border-border bg-background p-8 text-center"
          >
            <Badge variant="primary">{difficultyLabels[reviewCard.difficulty]}</Badge>
            <p className="mt-5 text-lg font-semibold text-foreground">
              {isFlipped ? reviewCard.answer : reviewCard.question}
            </p>
            <p className="mt-4 text-xs text-muted">
              {isFlipped ? "Respuesta" : "Pregunta"} · clic para voltear
            </p>
          </button>
          {isFlipped ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => void handleReview(false)}>
                Repasar despues
              </Button>
              <Button onClick={() => void handleReview(true)}>La recorde</Button>
            </div>
          ) : null}
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {cards.map((card) => (
            <li key={card.id} className="rounded-lg border border-border p-4">
              <Badge variant="primary">{difficultyLabels[card.difficulty]}</Badge>
              <p className="mt-3 font-medium text-foreground">{card.question}</p>
              <p className="mt-2 text-sm text-muted">{card.answer}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface QuizPanelProps {
  quizzes: Quiz[];
  selectedQuiz: Quiz | null;
  selectedQuizId: string;
  setSelectedQuizId: (quizId: string) => void;
  questions: QuizQuestion[];
  answers: Record<string, string>;
  setAnswers: (answers: Record<string, string>) => void;
  latestAttempt: QuizAttempt | null;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
}

function QuizPanel({
  quizzes,
  selectedQuiz,
  selectedQuizId,
  setSelectedQuizId,
  questions,
  answers,
  setAnswers,
  latestAttempt,
  isSubmitting,
  onSubmit,
}: QuizPanelProps) {
  function setAnswer(questionId: string, value: string) {
    setAnswers({ ...answers, [questionId]: value });
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Quizzes</h2>
        <p className="text-sm text-muted">
          {selectedQuiz ? selectedQuiz.title : "Selecciona o genera un quiz"}
        </p>
      </div>

      {quizzes.length > 0 ? (
        <select
          value={selectedQuizId}
          onChange={(event) => setSelectedQuizId(event.target.value)}
          className="mt-4 h-11 w-full max-w-md rounded-lg border border-border bg-card px-3 text-sm"
        >
          {quizzes.map((quiz) => (
            <option key={quiz.id} value={quiz.id}>
              {quiz.title}
            </option>
          ))}
        </select>
      ) : null}

      {questions.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          Aun no hay preguntas para mostrar.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {questions.map((question, index) => (
            <article key={question.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary">
                  {questionTypeLabels[question.question_type]}
                </Badge>
                <span className="text-xs text-muted">Pregunta {index + 1}</span>
              </div>
              <p className="mt-3 font-medium text-foreground">{question.prompt}</p>
              <QuestionAnswerControl
                question={question}
                value={answers[question.id] ?? ""}
                setValue={(value) => setAnswer(question.id, value)}
              />
            </article>
          ))}
          <Button
            disabled={Object.keys(answers).length === 0 || isSubmitting}
            onClick={() => void onSubmit()}
          >
            {isSubmitting ? "Enviando..." : "Enviar respuestas"}
          </Button>
        </div>
      )}

      {latestAttempt ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-semibold">
            Resultado: {latestAttempt.score ?? 0} puntos
          </p>
          {latestAttempt.feedback?.items?.length ? (
            <ul className="mt-3 space-y-2">
              {latestAttempt.feedback.items.map((item) => (
                <li key={item.question_id}>
                  {item.is_correct ? "Correcta" : "Revisar"} ·{" "}
                  {item.explanation || "Sin explicacion adicional"}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

interface QuestionAnswerControlProps {
  question: QuizQuestion;
  value: string;
  setValue: (value: string) => void;
}

function QuestionAnswerControl({
  question,
  value,
  setValue,
}: QuestionAnswerControlProps) {
  if (question.question_type === "multiple_choice" && question.options) {
    return (
      <div className="mt-3 space-y-2">
        {Object.entries(question.options).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={question.id}
              checked={value === key}
              onChange={() => setValue(key)}
            />
            <span>
              {key}. {label}
            </span>
          </label>
        ))}
      </div>
    );
  }

  if (question.question_type === "true_false") {
    return (
      <div className="mt-3 flex gap-4 text-sm">
        {["true", "false"].map((option) => (
          <label key={option} className="flex items-center gap-2">
            <input
              type="radio"
              name={question.id}
              checked={value === option}
              onChange={() => setValue(option)}
            />
            {option === "true" ? "Verdadero" : "Falso"}
          </label>
        ))}
      </div>
    );
  }

  return (
    <textarea
      value={value}
      onChange={(event) => setValue(event.target.value)}
      rows={4}
      className="mt-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
      placeholder="Escribe tu respuesta"
    />
  );
}
