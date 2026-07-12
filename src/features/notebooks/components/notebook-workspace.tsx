"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/src/features/auth/auth-context";
import {
  getNotebook,
  listNotebookMessages,
  sendNotebookMessage,
  updateNotebookSources,
  uploadNotebookSource,
} from "../api/service";
import type { ChatMessage, ChatNotebook } from "../types";

type Status = "idle" | "loading" | "success" | "error";

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploadingSource, setIsUploadingSource] = useState(false);
  const [isSourceDragOver, setIsSourceDragOver] = useState(false);
  const [error, setError] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(
    searchParams.get("new") === "1",
  );

  const loadNotebook = useCallback(async () => {
    setStatus("loading");
    try {
      const [currentNotebook, currentMessages] = await Promise.all([
        getNotebook(notebookId),
        listNotebookMessages(notebookId),
      ]);
      setNotebook(currentNotebook);
      setMessages(currentMessages);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, [notebookId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadNotebook(), 0);
    return () => window.clearTimeout(timer);
  }, [loadNotebook]);

  const sourceCount = notebook?.document_ids.length ?? 0;

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
      setNotebook(updatedNotebook);
      setIsSourceDialogOpen(false);
    } catch {
      setSourceError("No fue posible subir o asociar esas fuentes.");
    } finally {
      setIsUploadingSource(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
    } catch {
      setPrompt(content);
      setError("No fue posible generar una respuesta para este cuaderno.");
    } finally {
      setIsSending(false);
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
        <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 gap-3 p-3 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-white/8 bg-[#171a1d] p-4">
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

            <div className="grid min-h-[420px] place-items-center text-center">
              {sourceCount > 0 ? (
                <div className="max-w-[240px] text-sm text-white/55">
                  <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white/55">
                    {sourceCount}
                  </div>
                  <p className="font-semibold text-white/70">
                    {sourceCount} fuentes conectadas
                  </p>
                  <p className="mt-2 text-xs leading-5">
                    Ya puedes preguntarle al cuaderno sobre esos documentos.
                  </p>
                </div>
              ) : (
                <div className="max-w-[240px] text-sm text-white/42">
                  <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white/35">
                    +
                  </div>
                  <p className="font-semibold text-white/55">
                    Aun no hay fuentes
                  </p>
                  <p className="mt-2 text-xs leading-5">
                    Anade PDFs o presentaciones para alimentar este cuaderno.
                  </p>
                </div>
              )}
            </div>
          </aside>

          <main className="flex min-h-[78vh] flex-col rounded-xl border border-white/8 bg-[#171a1d]">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <h2 className="font-semibold">Chat</h2>
              <span className="text-xs text-white/45">{sourceCount} fuentes</span>
            </div>
            <div className="flex-1 space-y-4 overflow-auto p-5 sm:p-8">
              {messages.length === 0 ? (
                <div className="grid min-h-80 place-items-center text-center">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Anade fuentes para empezar
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-white/55">
                      Sube un PDF o PPTX y despues pregunta sobre ese contenido.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSourceDialogOpen(true)}
                      className="mt-5 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85"
                    >
                      Anadir fuentes
                    </button>
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
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {message.content}
                    </p>
                  </article>
                ))
              )}
              {isSending ? (
                <div className="max-w-3xl rounded-xl border border-white/10 bg-white/[0.05] p-4 text-sm text-white/55">
                  Generando respuesta...
                </div>
              ) : null}
            </div>

            <form onSubmit={submit} className="border-t border-white/8 p-4">
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
                  placeholder="Empieza a escribir..."
                  disabled={isSending || sourceCount === 0}
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSending || !prompt.trim() || sourceCount === 0}
                  className="flex h-10 w-16 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Enviar
                </button>
              </div>
            </form>
          </main>

          {isSourceDialogOpen ? (
            <div className="fixed inset-0 z-10 grid place-items-center bg-black/55 p-5">
              <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#101316] p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Anadir fuentes</h2>
                    <p className="mt-1 text-sm text-white/50">
                      Por ahora el backend acepta PDF y PPTX.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSourceDialogOpen(false)}
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
                    accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    multiple
                    className="hidden"
                    onChange={(event) => void uploadSources(event.target.files)}
                  />
                  <h3 className="font-semibold">Suelta tus archivos aqui</h3>
                  <p className="mt-2 text-sm text-white/50">
                    PDF y PPTX compatibles con el backend actual
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
