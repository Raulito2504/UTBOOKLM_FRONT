"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/src/components/ui/page-header";
import { Button } from "@/src/components/ui/button";
import { listDocuments } from "@/src/services/documents";
import {
  getRagHistory,
  submitRagQuery,
  summarizeDocuments,
} from "@/src/services/rag";
import type { RagQuery } from "@/src/types/rag";
import type { Document } from "@/src/types/documents";

export function RagView() {
  const [history, setHistory] = useState<RagQuery[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [activeQuery, setActiveQuery] = useState<RagQuery | null>(null);
  const [loading, setLoading] = useState(true);
  const [querying, setQuerying] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [historyRes, docsRes] = await Promise.all([
        getRagHistory(),
        listDocuments(),
      ]);
      setHistory(historyRes.items);
      setDocuments(docsRes.items.filter((d) => d.status === "ready"));
      if (historyRes.items.length > 0) {
        setActiveQuery(historyRes.items[0]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  function toggleDoc(id: string) {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!question.trim() || selectedDocIds.length === 0) return;

    setQuerying(true);
    setSummary(null);
    try {
      const result = await submitRagQuery({
        question: question.trim(),
        doc_ids: selectedDocIds,
      });
      setActiveQuery(result);
      setHistory((prev) => [result, ...prev]);
      setQuestion("");
    } finally {
      setQuerying(false);
    }
  }

  async function handleSummarize() {
    if (selectedDocIds.length === 0) return;
    setSummarizing(true);
    try {
      const result = await summarizeDocuments(selectedDocIds);
      setSummary(result.summary);
    } finally {
      setSummarizing(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse h-96 rounded-xl bg-slate-200" />;
  }

  return (
    <div>
      <PageHeader
        title="Consulta RAG"
        description="Haz preguntas en lenguaje natural sobre tus documentos y recibe respuestas con citas exactas a la fuente."
        action={
          <Button
            variant="secondary"
            disabled={selectedDocIds.length === 0 || summarizing}
            onClick={handleSummarize}
          >
            {summarizing ? "Generando..." : "Generar resumen"}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="space-y-4 lg:col-span-1">
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Documentos fuente
            </h2>
            {documents.length === 0 ? (
              <p className="text-xs text-muted">
                No hay documentos indexados. Sube archivos en la sección
                Documentos.
              </p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selectedDocIds.includes(doc.id)}
                        onChange={() => toggleDoc(doc.id)}
                        className="mt-0.5 h-4 w-4 rounded border-border text-primary"
                      />
                      <span className="text-sm text-foreground">{doc.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Historial
            </h2>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {history.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveQuery(item);
                      setSummary(null);
                    }}
                    className={`w-full rounded-lg px-2 py-2 text-left text-xs transition-colors ${
                      activeQuery?.id === item.id
                        ? "bg-primary-light text-primary"
                        : "text-muted hover:bg-slate-50 hover:text-foreground"
                    }`}
                  >
                    <p className="line-clamp-2 font-medium">{item.question}</p>
                    <p className="mt-0.5 text-[10px]">
                      {formatDate(item.created_at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <div className="space-y-4 lg:col-span-2">
          {summary && (
            <section className="rounded-xl border border-primary/20 bg-primary-light/30 p-5">
              <h2 className="text-sm font-semibold text-primary">Resumen</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {summary}
              </p>
            </section>
          )}

          <section className="flex min-h-[420px] flex-col rounded-xl border border-border bg-card shadow-sm">
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {activeQuery ? (
                <>
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-xl bg-primary px-4 py-3 text-sm text-white">
                      {activeQuery.question}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[90%] rounded-xl border border-border bg-slate-50 px-4 py-3">
                      <p className="text-sm leading-relaxed text-foreground">
                        {activeQuery.answer}
                      </p>
                      {activeQuery.sources.length > 0 && (
                        <div className="mt-4 border-t border-border pt-3">
                          <p className="text-xs font-semibold uppercase text-muted">
                            Fuentes citadas
                          </p>
                          <ul className="mt-2 space-y-2">
                            {activeQuery.sources.map((source, i) => (
                              <li
                                key={source.chunk_id}
                                className="rounded-lg bg-white px-3 py-2 text-xs"
                              >
                                <span className="font-semibold text-primary">
                                  [{i + 1}]
                                </span>{" "}
                                {source.document_title}, pág. {source.page}
                                <p className="mt-1 text-muted italic">
                                  &ldquo;{source.excerpt}&rdquo;
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted">
                  Selecciona documentos y haz tu primera pregunta
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-border p-4"
            >
              <div className="flex gap-2">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Escribe tu pregunta sobre el material..."
                  disabled={selectedDocIds.length === 0 || querying}
                  className="h-11 flex-1 rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                />
                <Button
                  type="submit"
                  disabled={
                    !question.trim() ||
                    selectedDocIds.length === 0 ||
                    querying
                  }
                >
                  {querying ? "Consultando..." : "Preguntar"}
                </Button>
              </div>
              {selectedDocIds.length === 0 && (
                <p className="mt-2 text-xs text-muted">
                  Selecciona al menos un documento para consultar
                </p>
              )}
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
