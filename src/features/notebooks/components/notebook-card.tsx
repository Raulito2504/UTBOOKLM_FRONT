"use client";

import Link from "next/link";
import { useState } from "react";
import type { NotebookCard as NotebookCardType } from "../types";
import { deleteNotebook } from "../api/service";

const cardThemes = [
  "bg-[#31363f]",
  "bg-[#3b3341]",
  "bg-[#373b2f]",
  "bg-[#2f3940]",
  "bg-[#43352f]",
  "bg-[#303348]",
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function themeFor(id: string) {
  const total = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return cardThemes[total % cardThemes.length];
}

export function NotebookCard({
  notebook,
  onDeleted,
}: {
  notebook: NotebookCardType;
  onDeleted?: (notebookId: string) => void;
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const href = `/notebooks/${notebook.id}${notebook.source_count === 0 ? "?new=1" : ""}`;

  async function removeNotebook() {
    if (isDeleting) return;
    setIsDeleting(true);
    setError("");
    try {
      await deleteNotebook(notebook.id);
      onDeleted?.(notebook.id);
    } catch {
      setError("No se pudo eliminar.");
      setIsDeleting(false);
    }
  }

  return (
    <article
      className={`flex min-h-40 flex-col justify-between rounded-lg border border-white/10 p-5 text-white shadow-sm ${themeFor(notebook.id)}`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/12 text-lg font-semibold">
            {notebook.title.trim().slice(0, 1).toUpperCase() || "C"}
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/75">
            {notebook.source_count} fuentes
          </span>
        </div>
        <h2 className="line-clamp-2 text-lg font-semibold leading-snug">
          {notebook.title || "Cuaderno sin titulo"}
        </h2>
        <p className="text-xs font-medium text-white/70">
          Actualizado {formatDate(notebook.updated_at)}
        </p>
        {notebook.source_count === 0 ? (
          <p className="text-xs text-white/55">Sin fuentes. Al abrirlo se pedira agregar PDF/PPTX.</p>
        ) : null}
      </div>

      <div className="mt-5 space-y-2">
        {isConfirmingDelete ? (
          <div className="rounded-lg border border-red-300/20 bg-red-500/10 p-3">
            <p className="text-xs text-red-100">Eliminar este cuaderno?</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => void removeNotebook()}
                disabled={isDeleting}
                className="rounded-full bg-red-300 px-3 py-1.5 text-xs font-semibold text-red-950 disabled:opacity-60"
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isDeleting}
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href={href}
              className="flex h-9 flex-1 items-center justify-center rounded-full bg-white px-3 text-sm font-semibold text-[#20242a] transition-colors hover:bg-slate-100"
            >
              Abrir
            </Link>
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="h-9 rounded-full border border-white/15 px-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
            >
              Eliminar
            </button>
          </div>
        )}
        {error ? <p className="text-xs text-red-300">{error}</p> : null}
      </div>
    </article>
  );
}
