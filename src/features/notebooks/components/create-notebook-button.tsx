"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createNotebook } from "../api/service";

export function CreateNotebookButton({
  variant = "button",
  onCreated,
}: {
  variant?: "button" | "card";
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("Cuaderno sin titulo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const notebookTitle = title.trim() || "Cuaderno sin titulo";
    setIsSubmitting(true);
    setError("");
    try {
      const notebook = await createNotebook({ title: notebookTitle });
      onCreated?.();
      setIsOpen(false);
      router.push(`/notebooks/${notebook.id}?new=1`);
    } catch {
      setError("No fue posible crear el cuaderno.");
      setIsSubmitting(false);
    }
  }

  const trigger =
    variant === "card" ? (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex min-h-40 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-white/20 bg-white/[0.03] p-5 text-white transition-colors hover:border-white/40 hover:bg-white/[0.06]"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3c4161] text-2xl">
          +
        </span>
        <span className="text-base font-semibold">Crear cuaderno</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#20242a] transition-colors hover:bg-slate-100"
      >
        + Crear nuevo
      </button>
    );

  return (
    <>
      {trigger}

      {isOpen ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/55 p-5">
          <form
            onSubmit={submit}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101316] p-6 text-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Nuevo cuaderno</h2>
                <p className="mt-1 text-sm text-white/50">
                  Primero crea el cuaderno; despues se abrira la carga de fuentes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-2xl text-white/55"
                aria-label="Cerrar"
              >
                x
              </button>
            </div>

            <label className="mt-6 block text-sm font-medium text-white/80">
              Nombre
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-[#171b20] px-3 text-sm text-white outline-none focus:border-white/35"
                autoFocus
              />
            </label>

            <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-semibold">Fuentes soportadas ahora</p>
              <p className="mt-1 text-sm text-white/55">
                PDF y PPTX. Otros tipos de fuente se agregaran despues.
              </p>
            </div>

            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-white/80"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#20242a] disabled:opacity-60"
              >
                {isSubmitting ? "Creando..." : "Crear cuaderno"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

