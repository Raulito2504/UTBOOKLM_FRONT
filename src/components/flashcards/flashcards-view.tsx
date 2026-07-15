"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/src/components/ui/page-header";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  generateExam,
  generateFlashcards,
  listExams,
  listFlashcards,
  reviewFlashcard,
} from "@/src/services/flashcards";
import { listDocuments } from "@/src/services/documents";
import type {
  ExamSummary,
  Flashcard,
  FlashcardType,
} from "@/src/types/flashcards";

type Tab = "flashcards" | "exams";

const typeLabels: Record<FlashcardType, string> = {
  definition: "Definición",
  concept: "Concepto",
  application: "Aplicación",
};

export function FlashcardsView() {
  const [tab, setTab] = useState<Tab>("flashcards");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingExam, setGeneratingExam] = useState(false);

  const [selectedDoc, setSelectedDoc] = useState("");
  const [cardType, setCardType] = useState<FlashcardType>("concept");
  const [count, setCount] = useState(5);

  const [reviewIndex, setReviewIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [docOptions, setDocOptions] = useState<{ id: string; title: string }[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fcRes, examList, docsRes] = await Promise.all([
        listFlashcards(),
        listExams(),
        listDocuments(),
      ]);
      setFlashcards(fcRes.items);
      setExams(examList);
      const ready = docsRes.items
        .filter((d) => d.status === "ready")
        .map((d) => ({ id: d.id, title: d.title }));
      setDocOptions(ready);
      if (ready.length > 0) {
        setSelectedDoc((prev) => prev || ready[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    if (!selectedDoc) return;

    setGenerating(true);
    try {
      const generated = await generateFlashcards({
        doc_ids: [selectedDoc],
        type: cardType,
        count,
      });
      setFlashcards((prev) => [...generated, ...prev]);
    } finally {
      setGenerating(false);
    }
  }

  async function handleReview(result: "correct" | "incorrect" | "skip") {
    const card = flashcards[reviewIndex];
    if (!card) return;

    await reviewFlashcard(card.id, result);
    setFlipped(false);
    if (reviewIndex < flashcards.length - 1) {
      setReviewIndex((i) => i + 1);
    } else {
      setReviewMode(false);
      setReviewIndex(0);
    }
  }

  async function handleGenerateExam() {
    if (!selectedDoc || generatingExam) return;
    setGeneratingExam(true);
    try {
      const exam = await generateExam([selectedDoc]);
      setExams((previous) => [exam, ...previous]);
    } finally {
      setGeneratingExam(false);
    }
  }

  const currentCard = flashcards[reviewIndex];

  if (loading) {
    return <div className="animate-pulse h-96 rounded-xl bg-slate-200" />;
  }

  return (
    <div>
      <PageHeader
        title="Flashcards y exámenes"
        description="Genera tarjetas de repaso y exámenes de práctica a partir de tus documentos con IA."
        action={
          tab === "flashcards" && flashcards.length > 0 ? (
            <Button onClick={() => { setReviewMode(true); setReviewIndex(0); setFlipped(false); }}>
              Iniciar repaso
            </Button>
          ) : tab === "exams" ? (
            <Button onClick={handleGenerateExam} disabled={!selectedDoc || generatingExam}>
              {generatingExam ? "Generando..." : "Generar examen"}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 flex gap-2 border-b border-border">
        {(["flashcards", "exams"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t === "flashcards" ? "Flashcards" : "Exámenes"}
          </button>
        ))}
      </div>

      {reviewMode && currentCard ? (
        <section className="mx-auto max-w-lg">
          <div className="mb-4 flex items-center justify-between text-sm text-muted">
            <span>
              Tarjeta {reviewIndex + 1} de {flashcards.length}
            </span>
            <button
              type="button"
              onClick={() => setReviewMode(false)}
              className="text-primary hover:underline"
            >
              Salir del repaso
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="flex min-h-56 w-full flex-col items-center justify-center rounded-xl border border-border bg-card p-8 shadow-sm transition-transform hover:shadow-md"
          >
            <Badge variant="primary">{typeLabels[currentCard.type]}</Badge>
            <p className="mt-4 text-center text-lg font-medium text-foreground">
              {flipped ? currentCard.back : currentCard.front}
            </p>
            <p className="mt-4 text-xs text-muted">
              {flipped ? "Respuesta" : "Pregunta"} · clic para voltear
            </p>
          </button>

          {flipped && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button variant="secondary" onClick={() => handleReview("incorrect")}>
                Incorrecta
              </Button>
              <Button variant="ghost" onClick={() => handleReview("skip")}>
                Saltar
              </Button>
              <Button onClick={() => handleReview("correct")}>
                Correcta
              </Button>
            </div>
          )}
        </section>
      ) : tab === "flashcards" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleGenerate}
            className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-1"
          >
            <h2 className="text-sm font-semibold text-foreground">
              Generar flashcards
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Documento
                </label>
                <select
                  value={selectedDoc}
                  onChange={(e) => setSelectedDoc(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
                >
                  {docOptions.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Tipo
                </label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value as FlashcardType)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
                >
                  <option value="definition">Definición</option>
                  <option value="concept">Concepto</option>
                  <option value="application">Aplicación</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Cantidad
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
                />
              </div>
              <Button type="submit" fullWidth disabled={generating || !selectedDoc}>
                {generating ? "Generando..." : "Generar con IA"}
              </Button>
            </div>
          </form>

          <div className="lg:col-span-2">
            {flashcards.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted">
                  No tienes flashcards. Genera un mazo desde un documento.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {flashcards.map((card) => (
                  <li
                    key={card.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge variant="primary">{typeLabels[card.type]}</Badge>
                        <p className="mt-2 font-medium text-foreground">
                          {card.front}
                        </p>
                        <p className="mt-1 text-sm text-muted">{card.back}</p>
                        <p className="mt-2 text-xs text-muted">
                          {card.doc_title}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted">
                No hay exámenes generados. Selecciona un documento y genera el
                primero con IA.
              </p>
            </div>
          ) : (
            exams.map((exam) => (
              <article
                key={exam.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div>
                  <h3 className="font-semibold text-foreground">{exam.title}</h3>
                  <p className="text-sm text-muted">{exam.doc_title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {exam.question_count} preguntas ·{" "}
                    {exam.types.join(", ")} ·{" "}
                    {formatDate(exam.created_at)}
                  </p>
                </div>
                <Button variant="secondary">Practicar</Button>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}
