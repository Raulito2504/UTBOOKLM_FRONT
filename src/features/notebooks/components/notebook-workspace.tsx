"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/src/features/auth/auth-context";
import { ApiError } from "@/src/lib/api/client";
import {
  generateFlashcardDeck,
  generateQuiz,
  listDeckCards,
  listFlashcardDecks,
  listQuizQuestions,
  listQuizzes,
  reviewFlashcard,
  submitQuizAnswers,
} from "@/src/features/study-practice/api/service";
import type {
  FlashcardCard,
  FlashcardDeck,
  Quiz,
  QuizAttempt,
  QuizQuestion,
} from "@/src/features/study-practice/types";
import {
  getNotebook,
  listNotebookSources,
  listNotebookMessages,
  removeNotebookSource,
  sendNotebookMessage,
  updateNotebookSources,
  uploadNotebookSource,
} from "../api/service";
import type { ChatMessage, ChatNotebook, NotebookDocument } from "../types";

type Status = "idle" | "loading" | "success" | "error";
type StudioMode = "home" | "flashcards" | "quiz";
type StudioStatus = "idle" | "generating" | "ready" | "error";
type QuizFeedbackItem = NonNullable<
  NonNullable<QuizAttempt["feedback"]>["items"]
>[number];

function formatHour(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function NotebookWorkspace({ notebookId }: { notebookId: string }) {
  const { user, logout } = useAuth();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notebook, setNotebook] = useState<ChatNotebook | null>(null);
  const [sources, setSources] = useState<NotebookDocument[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploadingSource, setIsUploadingSource] = useState(false);
  const [removingSourceId, setRemovingSourceId] = useState<string | null>(null);
  const [isSourceDragOver, setIsSourceDragOver] = useState(false);
  const [error, setError] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [studioMode, setStudioMode] = useState<StudioMode>("home");
  const [studioStatus, setStudioStatus] = useState<StudioStatus>("idle");
  const [studioError, setStudioError] = useState("");
  const [studioDeck, setStudioDeck] = useState<FlashcardDeck | null>(null);
  const [studioCards, setStudioCards] = useState<FlashcardCard[]>([]);
  const [studioCardIndex, setStudioCardIndex] = useState(0);
  const [isStudioCardFlipped, setIsStudioCardFlipped] = useState(false);
  const [studioQuiz, setStudioQuiz] = useState<Quiz | null>(null);
  const [studioQuestions, setStudioQuestions] = useState<QuizQuestion[]>([]);
  const [studioQuestionIndex, setStudioQuestionIndex] = useState(0);
  const [studioAnswers, setStudioAnswers] = useState<Record<string, string>>({});
  const [studioAttempt, setStudioAttempt] = useState<QuizAttempt | null>(null);
  const [isSubmittingStudioQuiz, setIsSubmittingStudioQuiz] = useState(false);
  const [savedStudioDecks, setSavedStudioDecks] = useState<FlashcardDeck[]>([]);
  const [savedStudioQuizzes, setSavedStudioQuizzes] = useState<Quiz[]>([]);
  const shouldOpenNewNotebookDialog = searchParams.get("new") === "1";

  const loadNotebook = useCallback(async () => {
    setStatus("loading");
    try {
      const [currentNotebook, currentMessages, deckList, quizList] = await Promise.all([
        getNotebook(notebookId),
        listNotebookMessages(notebookId),
        listFlashcardDecks(),
        listQuizzes(),
      ]);
      const currentSources = await listNotebookSources(notebookId);
      setNotebook(currentNotebook);
      setSources(currentSources);
      setMessages(currentMessages);
      setSavedStudioDecks(deckList);
      setSavedStudioQuizzes(quizList);
      const seenKey = `utbooklm:notebook:${notebookId}:source-dialog-seen`;
      const shouldAutoOpenSourceDialog =
        currentSources.length === 0 &&
        (shouldOpenNewNotebookDialog || currentMessages.length === 0) &&
        window.sessionStorage.getItem(seenKey) !== "1";
      if (shouldAutoOpenSourceDialog) {
        window.sessionStorage.setItem(seenKey, "1");
        setIsSourceDialogOpen(true);
      }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, [notebookId, shouldOpenNewNotebookDialog]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadNotebook(), 0);
    return () => window.clearTimeout(timer);
  }, [loadNotebook]);

  const sourceCount = sources.length;
  const readySources = useMemo(
    () =>
      sources.filter(
        (source) =>
          source.status === "ready" &&
          (source.chunk_count == null || Number(source.chunk_count) > 0),
      ),
    [sources],
  );
  const readySourceIds = useMemo(
    () => readySources.map((source) => source.id),
    [readySources],
  );
  const studioSourceCount = readySources.length;
  const studioCard = studioCards[studioCardIndex] ?? null;
  const studioQuestion = studioQuestions[studioQuestionIndex] ?? null;
  const notebookTitle = notebook?.title ?? "";
  const savedDecksForNotebook = useMemo(() => {
    const sourceIds = new Set(readySourceIds);
    return savedStudioDecks.filter((deck) =>
      deck.notebook_id === notebookId ||
      deck.document_ids?.some((documentId) => sourceIds.has(documentId)) ||
      (deck.document_id ? sourceIds.has(deck.document_id) : false),
    );
  }, [notebookId, readySourceIds, savedStudioDecks]);
  const savedQuizzesForNotebook = useMemo(() => {
    const sourceIds = new Set(readySourceIds);
    return savedStudioQuizzes.filter((quiz) =>
      quiz.notebook_id === notebookId ||
      quiz.document_ids?.some((documentId) => sourceIds.has(documentId)) ||
      (quiz.document_id ? sourceIds.has(quiz.document_id) : false),
    );
  }, [notebookId, readySourceIds, savedStudioQuizzes]);

  async function uploadSources(files: FileList | null) {
    if (!files?.length || isUploadingSource) return;

    setIsUploadingSource(true);
    setSourceError("");
    try {
      const documentIds: string[] = [];
      for (const file of Array.from(files)) {
        const document = await uploadNotebookSource(file);
        documentIds.push(document.id);
      }
      const updatedNotebook = await updateNotebookSources(notebookId, documentIds);
      const updatedSources = await listNotebookSources(notebookId);
      setNotebook(updatedNotebook);
      setSources(updatedSources);
      window.sessionStorage.setItem(
        `utbooklm:notebook:${notebookId}:source-dialog-seen`,
        "1",
      );
      setIsSourceDialogOpen(false);
    } catch {
      setSourceError("No fue posible subir o asociar esas fuentes.");
    } finally {
      setIsUploadingSource(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeSource(documentId: string) {
    if (removingSourceId) return;

    setRemovingSourceId(documentId);
    setSourceError("");
    try {
      await removeNotebookSource(notebookId, documentId);
      setSources((current) => current.filter((source) => source.id !== documentId));
      setNotebook((current) =>
        current
          ? {
              ...current,
              document_ids: current.document_ids.filter((id) => id !== documentId),
            }
          : current,
      );
    } catch {
      setSourceError("No fue posible quitar esa fuente.");
    } finally {
      setRemovingSourceId(null);
    }
  }

  function closeSourceDialog() {
    window.sessionStorage.setItem(
      `utbooklm:notebook:${notebookId}:source-dialog-seen`,
      "1",
    );
    setIsSourceDialogOpen(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = prompt.trim();
    if (!content || isSending || sourceCount === 0) return;

    setIsSending(true);
    setError("");
    setPrompt("");
    try {
      const response = await sendNotebookMessage(notebookId, content);
      setMessages((current) => [
        ...current,
        response.user_message,
        response.assistant_message,
      ]);
    } catch (exc) {
      setPrompt(content);
      setError(
        exc instanceof ApiError && exc.errorCode === "dependency_unavailable"
          ? "La IA no esta disponible con la configuracion actual. Puedes seguir estudiando con Studio."
          : "No fue posible generar una respuesta para este cuaderno.",
      );
    } finally {
      setIsSending(false);
    }
  }

  async function startStudioFlashcards() {
    if (studioSourceCount === 0 || studioStatus === "generating") return;

    setStudioMode("flashcards");
    setStudioStatus("generating");
    setStudioError("");
    setStudioDeck(null);
    setStudioCards([]);
    setStudioCardIndex(0);
    setIsStudioCardFlipped(false);
    try {
      const deck = await generateFlashcardDeck({
        document_ids: readySourceIds,
        notebook_id: notebookId,
        count: 10,
        difficulty: "medium",
        deck_name: `${notebookTitle || "Cuaderno"} Flashcards`,
      });
      const cards = await listDeckCards(deck.id);
      setStudioDeck(deck);
      setStudioCards(cards);
      setSavedStudioDecks((current) => [
        deck,
        ...current.filter((item) => item.id !== deck.id),
      ]);
      setStudioStatus("ready");
    } catch {
      setStudioStatus("error");
      setStudioError("No fue posible generar tarjetas con estas fuentes.");
    }
  }

  async function startStudioQuiz() {
    if (studioSourceCount === 0 || studioStatus === "generating") return;

    setStudioMode("quiz");
    setStudioStatus("generating");
    setStudioError("");
    setStudioQuiz(null);
    setStudioQuestions([]);
    setStudioQuestionIndex(0);
    setStudioAnswers({});
    setStudioAttempt(null);
    try {
      const quiz = await generateQuiz({
        document_ids: readySourceIds,
        notebook_id: notebookId,
        title: `${notebookTitle || "Cuaderno"} Cuestionario`,
        question_count: 10,
        question_types: ["multiple_choice"],
      });
      const questions = await listQuizQuestions(quiz.id);
      setStudioQuiz(quiz);
      setStudioQuestions(questions);
      setSavedStudioQuizzes((current) => [
        quiz,
        ...current.filter((item) => item.id !== quiz.id),
      ]);
      setStudioStatus("ready");
    } catch {
      setStudioStatus("error");
      setStudioError("No fue posible generar un cuestionario con estas fuentes.");
    }
  }

  async function openSavedStudioDeck(deck: FlashcardDeck) {
    setStudioMode("flashcards");
    setStudioStatus("generating");
    setStudioError("");
    setStudioDeck(deck);
    setStudioCards([]);
    setStudioCardIndex(0);
    setIsStudioCardFlipped(false);
    try {
      const cards = await listDeckCards(deck.id);
      setStudioCards(cards);
      setStudioStatus("ready");
    } catch {
      setStudioStatus("error");
      setStudioError("No fue posible abrir estas tarjetas.");
    }
  }

  async function openSavedStudioQuiz(quiz: Quiz) {
    setStudioMode("quiz");
    setStudioStatus("generating");
    setStudioError("");
    setStudioQuiz(quiz);
    setStudioQuestions([]);
    setStudioQuestionIndex(0);
    setStudioAnswers({});
    setStudioAttempt(null);
    try {
      const questions = await listQuizQuestions(quiz.id);
      setStudioQuestions(questions);
      setStudioStatus("ready");
    } catch {
      setStudioStatus("error");
      setStudioError("No fue posible abrir este cuestionario.");
    }
  }

  async function reviewStudioCard(remembered: boolean) {
    if (!studioCard) return;

    await reviewFlashcard(studioCard.id, remembered);
    setIsStudioCardFlipped(false);
    setStudioCardIndex((current) =>
      current < studioCards.length - 1 ? current + 1 : 0,
    );
  }

  async function submitStudioQuiz() {
    if (!studioQuiz || Object.keys(studioAnswers).length === 0) return;

    setIsSubmittingStudioQuiz(true);
    setStudioError("");
    try {
      const attempt = await submitQuizAnswers(studioQuiz.id, studioAnswers);
      setStudioAttempt(attempt);
    } catch {
      setStudioError("No fue posible enviar tus respuestas.");
    } finally {
      setIsSubmittingStudioQuiz(false);
    }
  }

  return (
    <section className="min-h-screen bg-[#111417] text-white">
      <header className="border-b border-white/10 px-5 py-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/notebooks"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/12 text-sm font-semibold text-white"
              aria-label="Volver a mis cuadernos"
            >
              N
            </Link>
            <div className="min-w-0">
              <p className="text-xs text-white/45">Cuaderno</p>
              <h1 className="truncate text-lg font-semibold">
                {notebook?.title ?? "Cargando cuaderno..."}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-xs font-semibold uppercase">
              {(user?.name || user?.email || "U").slice(0, 1)}
            </div>
            <div className="min-w-0 text-sm leading-tight">
              <p className="max-w-44 truncate font-medium text-white">
                {user?.name || "Usuario"}
              </p>
              <p className="max-w-44 truncate text-xs text-white/50">
                {user?.email || "Sesion activa"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {status === "loading" || status === "idle" ? (
        <div className="grid min-h-[70vh] place-items-center text-sm text-white/55">
          Preparando cuaderno...
        </div>
      ) : null}

      {status === "error" ? (
        <div className="p-8">
          <div className="rounded-lg border border-red-300/30 bg-red-400/10 p-5 text-sm text-red-100">
            No fue posible abrir este cuaderno.
          </div>
        </div>
      ) : null}

      {status === "success" ? (
        <div className="grid h-[calc(100vh-4rem)] grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_300px]">
          <aside className="flex min-h-0 flex-col rounded-xl border border-white/8 bg-[#171a1d] p-4">
            <div className="shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Fuentes</h2>
                <span className="text-sm text-white/50">{sourceCount}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSourceDialogOpen(true)}
                className="mt-5 h-10 w-full rounded-full border border-white/12 text-sm font-semibold text-white/85 transition-colors hover:bg-white/[0.05]"
              >
                + Anadir fuentes
              </button>
            </div>

            {sourceError ? (
              <p className="mt-4 shrink-0 rounded-lg border border-red-300/25 bg-red-400/10 px-3 py-2 text-xs text-red-200">
                {sourceError}
              </p>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {sourceCount > 0 ? (
                <div className="mt-5 space-y-3">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white/85">
                            {source.title || "Fuente sin titulo"}
                          </p>
                          <p className="mt-1 truncate text-xs text-white/45">
                            {source.original_filename || source.mime_type || source.id}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void removeSource(source.id)}
                          disabled={removingSourceId === source.id}
                          className="shrink-0 rounded-full border border-white/12 px-2.5 py-1 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 disabled:opacity-45"
                        >
                          {removingSourceId === source.id ? "..." : "Quitar"}
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/45">
                        <span className="rounded-full bg-white/[0.06] px-2 py-1">
                          {source.mime_type?.includes("presentation")
                            ? "PPTX"
                            : source.mime_type?.includes("markdown")
                              ? "MD"
                              : source.mime_type?.includes("text")
                                ? "TXT"
                                : "PDF"}
                        </span>
                        <span className="rounded-full bg-white/[0.06] px-2 py-1">
                          {source.page_count} paginas
                        </span>
                        <span className="rounded-full bg-white/[0.06] px-2 py-1">
                          {source.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid h-full min-h-80 place-items-center text-center">
                  <div className="max-w-[240px] text-sm text-white/42">
                    <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white/35">
                      +
                    </div>
                    <p className="font-semibold text-white/55">
                      Aun no hay fuentes
                    </p>
                    <p className="mt-2 text-xs leading-5">
                      Anade PDF, PPTX, Markdown o texto para alimentar este cuaderno.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <main className="flex min-h-0 flex-col rounded-xl border border-white/8 bg-[#171a1d]">
            <div className="shrink-0 flex items-center justify-between border-b border-white/8 px-4 py-3">
              <h2 className="font-semibold">Chat</h2>
              <span className="text-xs text-white/45">{sourceCount} fuentes</span>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-8">
              {messages.length === 0 ? (
                <div className="grid min-h-80 place-items-center text-center">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {sourceCount > 0
                        ? "Pregunta sobre tus fuentes"
                        : "Anade fuentes para empezar"}
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-white/55">
                      {sourceCount > 0
                        ? "Usa el chat o genera material de practica desde Studio."
                        : "Sube una fuente y despues pregunta sobre ese contenido."}
                    </p>
                    {sourceCount === 0 ? (
                      <button
                        type="button"
                        onClick={() => setIsSourceDialogOpen(true)}
                        className="mt-5 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85"
                      >
                        Anadir fuentes
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <article
                    key={message.id}
                    className={`max-w-3xl rounded-xl border p-4 ${
                      message.role === "user"
                        ? "ml-auto border-white/10 bg-white text-[#20242a]"
                        : "border-white/10 bg-white/[0.05] text-white"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-4 text-xs opacity-60">
                      <span>{message.role === "user" ? "Tu" : "UTBookLM"}</span>
                      <span>{formatHour(message.created_at)}</span>
                    </div>
                    <ChatMessageContent
                      content={message.content}
                      variant={message.role === "user" ? "light" : "dark"}
                    />
                  </article>
                ))
              )}
              {isSending ? (
                <div className="max-w-3xl rounded-xl border border-white/10 bg-white/[0.05] p-4 text-sm text-white/65">
                  <div className="mb-2 flex items-center justify-between gap-4 text-xs opacity-60">
                    <span>UTBookLM</span>
                    <span>Ahora</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Generando respuesta</span>
                    <TypingDots />
                  </div>
                </div>
              ) : null}
            </div>

            <form onSubmit={submit} className="shrink-0 border-t border-white/8 p-4">
              {error ? <p className="mb-2 text-sm text-red-300">{error}</p> : null}
              {sourceCount === 0 ? (
                <p className="mb-2 text-xs text-white/45">
                  Primero anade una fuente para poder preguntar.
                </p>
              ) : null}
              <div className="flex gap-3 rounded-2xl border border-white/10 bg-[#111417] p-2">
                <input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={isSending ? "Generando respuesta..." : "Empieza a escribir..."}
                  disabled={isSending || sourceCount === 0}
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSending || !prompt.trim() || sourceCount === 0}
                  className="flex h-10 w-16 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {isSending ? "..." : "Enviar"}
                </button>
              </div>
            </form>
          </main>

          <aside className="min-h-0 overflow-hidden rounded-xl border border-white/8 bg-[#171a1d]">
            {studioMode === "home" ? (
              <StudioHomePanel
                sourceCount={sourceCount}
                readySourceCount={studioSourceCount}
                isGenerating={studioStatus === "generating"}
                savedDecks={savedDecksForNotebook}
                savedQuizzes={savedQuizzesForNotebook}
                onGenerateFlashcards={() => void startStudioFlashcards()}
                onGenerateQuiz={() => void startStudioQuiz()}
                onOpenDeck={(deck) => void openSavedStudioDeck(deck)}
                onOpenQuiz={(quiz) => void openSavedStudioQuiz(quiz)}
              />
            ) : studioMode === "quiz" ? (
              <StudioQuizPanel
                quiz={studioQuiz}
                question={studioQuestion}
                questionIndex={studioQuestionIndex}
                questionCount={studioQuestions.length}
                answers={studioAnswers}
                attempt={studioAttempt}
                status={studioStatus}
                error={studioError}
                sourceCount={studioSourceCount}
                isSubmitting={isSubmittingStudioQuiz}
                onBack={() => setStudioMode("home")}
                onAnswer={(questionId, value) =>
                  setStudioAnswers((current) => ({
                    ...current,
                    [questionId]: value,
                  }))
                }
                onNext={() =>
                  setStudioQuestionIndex((current) =>
                    current < studioQuestions.length - 1 ? current + 1 : current,
                  )
                }
                onPrevious={() =>
                  setStudioQuestionIndex((current) =>
                    current > 0 ? current - 1 : current,
                  )
                }
                onSubmit={() => void submitStudioQuiz()}
              />
            ) : (
              <StudioFlashcardsPanel
                deck={studioDeck}
                card={studioCard}
                cardIndex={studioCardIndex}
                cardCount={studioCards.length}
                isFlipped={isStudioCardFlipped}
                status={studioStatus}
                error={studioError}
                sourceCount={studioSourceCount}
                onBack={() => setStudioMode("home")}
                onFlip={() => setIsStudioCardFlipped((current) => !current)}
                onReview={(remembered) => void reviewStudioCard(remembered)}
              />
            )}
          </aside>

          {isSourceDialogOpen ? (
            <div className="fixed inset-0 z-10 grid place-items-center bg-black/55 p-5">
              <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#101316] p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Anadir fuentes</h2>
                    <p className="mt-1 text-sm text-white/50">
                      El backend acepta PDF, PPTX, Markdown y texto plano.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeSourceDialog}
                    className="text-2xl text-white/55"
                    aria-label="Cerrar"
                  >
                    x
                  </button>
                </div>

                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsSourceDragOver(true);
                  }}
                  onDragLeave={() => setIsSourceDragOver(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsSourceDragOver(false);
                    void uploadSources(event.dataTransfer.files);
                  }}
                  className={`mt-6 rounded-xl border border-dashed p-10 text-center ${
                    isSourceDragOver
                      ? "border-[#7f8cff] bg-white/[0.07]"
                      : "border-white/18 bg-white/[0.03]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.pptx,.md,.txt,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/markdown,text/plain"
                    multiple
                    className="hidden"
                    onChange={(event) => void uploadSources(event.target.files)}
                  />
                  <h3 className="font-semibold">Suelta tus archivos aqui</h3>
                  <p className="mt-2 text-sm text-white/50">
                    PDF, PPTX, MD y TXT compatibles con el backend actual
                  </p>
                  {sourceError ? (
                    <p className="mt-4 text-sm text-red-300">{sourceError}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingSource}
                    className="mt-8 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#20242a] disabled:opacity-60"
                  >
                    {isUploadingSource ? "Subiendo..." : "Seleccionar archivos"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

interface StudioActionProps {
  title: string;
  description: string;
  enabled: boolean;
  accent: string;
  onClick: () => void;
}

function StudioHomePanel({
  sourceCount,
  readySourceCount,
  isGenerating,
  savedDecks,
  savedQuizzes,
  onGenerateFlashcards,
  onGenerateQuiz,
  onOpenDeck,
  onOpenQuiz,
}: {
  sourceCount: number;
  readySourceCount: number;
  isGenerating: boolean;
  savedDecks: FlashcardDeck[];
  savedQuizzes: Quiz[];
  onGenerateFlashcards: () => void;
  onGenerateQuiz: () => void;
  onOpenDeck: (deck: FlashcardDeck) => void;
  onOpenQuiz: (quiz: Quiz) => void;
}) {
  const enabled = readySourceCount > 0 && !isGenerating;
  const hasSavedItems = savedDecks.length > 0 || savedQuizzes.length > 0;

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Studio</h2>
        <span className="text-xs text-white/45">{sourceCount} fuentes</span>
      </div>

      <div className="mt-5 grid gap-3">
        <StudioAction
          title="Tarjetas didacticas"
          description="Genera flashcards desde estas fuentes."
          enabled={enabled}
          accent="bg-[#253348] text-[#b9d4ff]"
          onClick={onGenerateFlashcards}
        />
        <StudioAction
          title="Cuestionario"
          description="Crea un quiz para practicar aqui."
          enabled={enabled}
          accent="bg-[#2d3a2c] text-[#bdf5c7]"
          onClick={onGenerateQuiz}
        />
      </div>

      {isGenerating ? (
        <div className="mt-8 rounded-lg border border-white/8 bg-white/[0.045] p-4 text-sm text-white/70">
          Generando material de practica...
        </div>
      ) : null}

      <div className="mt-8 border-t border-white/8 pt-5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
          Resultados
        </h3>

        {hasSavedItems ? (
          <div className="mt-4 space-y-2">
            {savedQuizzes.map((quiz) => (
              <StudioSavedItem
                key={quiz.id}
                label="Cuestionario"
                title={quiz.title}
                onClick={() => onOpenQuiz(quiz)}
              />
            ))}
            {savedDecks.map((deck) => (
              <StudioSavedItem
                key={deck.id}
                label={`${deck.card_count} tarjetas`}
                title={deck.name}
                onClick={() => onOpenDeck(deck)}
              />
            ))}
          </div>
        ) : (
          <div className="pt-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white/35">
              *
            </div>
            <p className="mt-4 text-sm font-semibold text-white/70">
              {readySourceCount > 0
                ? "Los resultados de Studio se guardaran aqui."
                : "Anade una fuente lista para activar Studio."}
            </p>
            <p className="mt-2 text-xs leading-5 text-white/45">
              Solo mostramos funciones conectadas al backend actual.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StudioSavedItem({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.035] p-3 text-left transition-colors hover:border-white/18 hover:bg-white/[0.07]"
    >
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-white/45">{label}</span>
        <span className="mt-1 block truncate text-sm font-semibold text-white/85">
          {title}
        </span>
      </span>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm text-white/70">
        &gt;
      </span>
    </button>
  );
}

function StudioAction({
  title,
  description,
  enabled,
  accent,
  onClick,
}: StudioActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      className="flex w-full items-center gap-3 rounded-lg border border-white/8 bg-white/[0.045] p-3 transition-colors hover:border-white/18 hover:bg-white/[0.075] disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm ${accent}`}>
        {title.slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-semibold text-white/90">{title}</span>
        <span className="mt-1 block text-xs leading-4 text-white/48">
          {description}
        </span>
      </span>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm text-white/70">
        &gt;
      </span>
    </button>
  );
}

interface StudioQuizPanelProps {
  quiz: Quiz | null;
  question: QuizQuestion | null;
  questionIndex: number;
  questionCount: number;
  answers: Record<string, string>;
  attempt: QuizAttempt | null;
  status: StudioStatus;
  error: string;
  sourceCount: number;
  isSubmitting: boolean;
  onBack: () => void;
  onAnswer: (questionId: string, value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
}

function StudioQuizPanel({
  quiz,
  question,
  questionIndex,
  questionCount,
  answers,
  attempt,
  status,
  error,
  sourceCount,
  isSubmitting,
  onBack,
  onAnswer,
  onNext,
  onPrevious,
  onSubmit,
}: StudioQuizPanelProps) {
  const answerValue = question ? answers[question.id] ?? "" : "";
  const isLastQuestion = questionIndex >= questionCount - 1;
  const currentFeedback =
    question && attempt?.feedback?.items
      ? attempt.feedback.items.find((item) => item.question_id === question.id) ?? null
      : null;
  const hasSubmitted = Boolean(attempt);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <StudioPanelHeader onBack={onBack} title="Cuestionario" />
      <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.28)_transparent]">
        <h2 className="text-lg font-semibold text-white">
          {quiz?.title ?? "Generando cuestionario"}
        </h2>
        <p className="mt-2 inline-flex rounded-full border border-white/12 px-3 py-1 text-xs text-white/70">
          {sourceCount} {sourceCount === 1 ? "fuente" : "fuentes"}
        </p>

        {status === "generating" ? (
          <StudioLoadingState label="Generando cuestionario..." />
        ) : null}

        {status === "error" ? <StudioErrorState message={error} /> : null}

        {status === "ready" && question ? (
          <div className="mt-8">
            <div className="mb-5 flex items-center justify-between text-xs text-white/45">
              <span>
                {questionIndex + 1}/{questionCount}
              </span>
            </div>
            <p className="text-sm font-semibold leading-6 text-white">
              {question.prompt}
            </p>
            <StudioQuestionAnswer
              question={question}
              value={answerValue}
              feedback={currentFeedback}
              submitted={hasSubmitted}
              onChange={(value) => onAnswer(question.id, value)}
            />
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onPrevious}
                disabled={questionIndex === 0}
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/75 disabled:opacity-35"
              >
                Anterior
              </button>
              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!answerValue || isSubmitting || hasSubmitted}
                  className="rounded-full bg-[#5865ff] px-4 py-2 text-xs font-semibold text-white disabled:opacity-45"
                >
                  {hasSubmitted
                    ? "Enviado"
                    : isSubmitting
                      ? "Enviando..."
                      : "Enviar"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNext}
                  disabled={!answerValue}
                  className="rounded-full bg-[#5865ff] px-4 py-2 text-xs font-semibold text-white disabled:opacity-45"
                >
                  Siguiente
                </button>
              )}
            </div>
          </div>
        ) : null}

        {status === "ready" && !question ? (
          <StudioErrorState message="No llegaron preguntas para este cuestionario." />
        ) : null}
      </div>

      <div className="shrink-0 border-t border-white/8 p-4">
        {attempt ? (
          <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">
            <p className="font-semibold">Resultado: {attempt.score ?? 0} puntos</p>
            <p className="mt-1 text-xs text-emerald-100/70">
              Revisa las opciones marcadas en cada pregunta.
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-full border border-white/12 px-3 py-2 text-xs font-semibold text-white/75"
            >
              Contenido adecuado
            </button>
            <button
              type="button"
              className="flex-1 rounded-full border border-white/12 px-3 py-2 text-xs font-semibold text-white/75"
            >
              Contenido inadecuado
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface StudioFlashcardsPanelProps {
  deck: FlashcardDeck | null;
  card: FlashcardCard | null;
  cardIndex: number;
  cardCount: number;
  isFlipped: boolean;
  status: StudioStatus;
  error: string;
  sourceCount: number;
  onBack: () => void;
  onFlip: () => void;
  onReview: (remembered: boolean) => void;
}

function StudioFlashcardsPanel({
  deck,
  card,
  cardIndex,
  cardCount,
  isFlipped,
  status,
  error,
  sourceCount,
  onBack,
  onFlip,
  onReview,
}: StudioFlashcardsPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <StudioPanelHeader onBack={onBack} title="Tarjetas didacticas" />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <h2 className="text-lg font-semibold text-white">
          {deck?.name ?? "Generando tarjetas"}
        </h2>
        <p className="mt-2 inline-flex rounded-full border border-white/12 px-3 py-1 text-xs text-white/70">
          {sourceCount} {sourceCount === 1 ? "fuente" : "fuentes"}
        </p>

        {status === "generating" ? (
          <StudioLoadingState label="Generando tarjetas..." />
        ) : null}

        {status === "error" ? <StudioErrorState message={error} /> : null}

        {status === "ready" && card ? (
          <div className="mt-8">
            <p className="mb-4 text-xs text-white/45">
              {cardIndex + 1}/{cardCount}
            </p>
            <button
              type="button"
              onClick={onFlip}
              className="flex min-h-56 w-full flex-col items-center justify-center rounded-xl border border-white/10 bg-[#12161b] p-5 text-center"
            >
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                {isFlipped ? "Respuesta" : "Pregunta"}
              </span>
              <p className="mt-5 text-sm font-semibold leading-6 text-white">
                {isFlipped ? card.answer : card.question}
              </p>
              <span className="mt-5 text-xs text-white/35">
                Clic para voltear
              </span>
            </button>

            {isFlipped ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onReview(false)}
                  className="rounded-full border border-white/12 px-3 py-2 text-xs font-semibold text-white/75"
                >
                  Repasar
                </button>
                <button
                  type="button"
                  onClick={() => onReview(true)}
                  className="rounded-full bg-[#5865ff] px-3 py-2 text-xs font-semibold text-white"
                >
                  La recorde
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {status === "ready" && !card ? (
          <StudioErrorState message="No llegaron tarjetas para este mazo." />
        ) : null}
      </div>
    </div>
  );
}

function StudioPanelHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-semibold text-white/85"
      >
        Studio &gt; Aplicacion
      </button>
      <span className="text-xs text-white/45">{title}</span>
    </div>
  );
}

function StudioLoadingState({ label }: { label: string }) {
  return (
    <div className="mt-8 rounded-lg border border-white/8 bg-white/[0.045] p-4">
      <p className="text-sm font-semibold text-white/80">{label}</p>
      <p className="mt-1 text-xs text-white/45">Basado en tus fuentes listas.</p>
    </div>
  );
}

function StudioErrorState({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-lg border border-red-300/25 bg-red-400/10 p-3 text-sm text-red-200">
      {message}
    </div>
  );
}

function StudioQuestionAnswer({
  question,
  value,
  feedback,
  submitted,
  onChange,
}: {
  question: QuizQuestion;
  value: string;
  feedback: QuizFeedbackItem | null;
  submitted: boolean;
  onChange: (value: string) => void;
}) {
  if (question.question_type === "multiple_choice" && question.options) {
    return (
      <div className="mt-6 space-y-3">
        {Object.entries(question.options).map(([key, label]) => {
          const state = answerState({
            option: key,
            value,
            feedback,
            submitted,
          });
          return (
            <label
              key={key}
              className={`flex gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${answerStateClass(state)} ${
                submitted ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                checked={value === key}
                onChange={() => onChange(key)}
                disabled={submitted}
                className="mt-1"
              />
              <span className="flex-1">
                {key}. {label}
              </span>
              {state === "correct" ? (
                <span className="text-xs font-semibold text-emerald-200">
                  Correcta
                </span>
              ) : null}
              {state === "incorrect" ? (
                <span className="text-xs font-semibold text-red-200">Tu respuesta</span>
              ) : null}
            </label>
          );
        })}
        {submitted && feedback?.explanation ? (
          <p className="rounded-lg border border-white/8 bg-white/[0.035] px-3 py-2 text-xs leading-5 text-white/60">
            {feedback.explanation}
          </p>
        ) : null}
      </div>
    );
  }

  if (question.question_type === "true_false") {
    return (
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          ["true", "Verdadero"],
          ["false", "Falso"],
        ].map(([option, label]) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            disabled={submitted}
            className={`rounded-lg border px-4 py-3 text-sm font-semibold ${answerStateClass(
              answerState({ option, value, feedback, submitted }),
            )}`}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={submitted}
      rows={5}
      className={`mt-6 w-full rounded-lg border px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 disabled:opacity-75 ${
        submitted && feedback?.is_correct === false
          ? "border-red-300/45 bg-red-500/10"
          : submitted && feedback?.is_correct === true
            ? "border-emerald-300/45 bg-emerald-500/10"
            : "border-white/8 bg-[#12161b]"
      }`}
      placeholder="Escribe tu respuesta"
    />
  );
}

type AnswerState = "idle" | "selected" | "correct" | "incorrect";

function answerState({
  option,
  value,
  feedback,
  submitted,
}: {
  option: string;
  value: string;
  feedback: QuizFeedbackItem | null;
  submitted: boolean;
}): AnswerState {
  if (!submitted) {
    return value === option ? "selected" : "idle";
  }

  if (feedback?.correct_answer === option) {
    return "correct";
  }

  const submittedAnswer = feedback?.submitted_answer ?? value;
  if (submittedAnswer === option && feedback?.is_correct === false) {
    return "incorrect";
  }

  return "idle";
}

function answerStateClass(state: AnswerState) {
  if (state === "correct") {
    return "border-emerald-300/55 bg-emerald-500/15 text-emerald-50";
  }
  if (state === "incorrect") {
    return "border-red-300/55 bg-red-500/15 text-red-50";
  }
  if (state === "selected") {
    return "border-[#5865ff] bg-[#5865ff]/15 text-white";
  }
  return "border-white/8 bg-[#12161b] text-white/80 hover:bg-white/[0.055]";
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-current"
          style={{ animationDelay: `${index * 160}ms` }}
        />
      ))}
    </span>
  );
}

function ChatMessageContent({
  content,
  variant,
}: {
  content: string;
  variant: "dark" | "light";
}) {
  const blocks = parseChatBlocks(content);

  return (
    <div
      className={`space-y-3 text-sm leading-6 ${
        variant === "dark" ? "text-white/90" : "text-[#20242a]"
      }`}
    >
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ol key={index} className="space-y-3 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={`${index}-${itemIndex}`} className="list-decimal pl-1">
                  <InlineMarkdown text={item} />
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "bullets") {
          return (
            <ul key={index} className="space-y-2 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={`${index}-${itemIndex}`} className="list-disc pl-1">
                  <InlineMarkdown text={item} />
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index}>
            <InlineMarkdown text={block.text} />
          </p>
        );
      })}
    </div>
  );
}

type ChatBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "bullets"; items: string[] };

function parseChatBlocks(content: string): ChatBlock[] {
  const lines = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const blocks: ChatBlock[] = [];

  for (const line of lines) {
    const numbered = line.match(/^\d+\.\s*(.*)$/);
    if (numbered) {
      const last = blocks.at(-1);
      if (last?.type === "list") {
        last.items.push(numbered[1]);
      } else {
        blocks.push({ type: "list", items: [numbered[1]] });
      }
      continue;
    }

    const bullet = line.match(/^(?:[-*]|•)\s*(.*)$/);
    if (bullet) {
      const last = blocks.at(-1);
      if (last?.type === "bullets") {
        last.items.push(bullet[1]);
      } else {
        blocks.push({ type: "bullets", items: [bullet[1]] });
      }
      continue;
    }

    blocks.push({ type: "paragraph", text: line });
  }

  return blocks;
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
