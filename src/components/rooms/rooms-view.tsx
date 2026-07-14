"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/src/components/ui/page-header";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  createRoom,
  deleteRoom,
  joinRoom,
  listRooms,
} from "@/src/services/rooms";
import type { RoomVisibility, StudyRoom } from "@/src/types/rooms";

const roleLabels: Record<NonNullable<StudyRoom["role"]>, string> = {
  owner: "Propietario",
  editor: "Editor",
  reader: "Lector",
};

export function RoomsView() {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<"all" | "mine" | "public">("all");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<RoomVisibility>("public");

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listRooms();
      setRooms(response.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRooms(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRooms]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      const room = await createRoom({
        name: name.trim(),
        description: description.trim(),
        visibility,
      });
      setRooms((prev) => [room, ...prev]);
      setShowForm(false);
      setName("");
      setDescription("");
      setVisibility("public");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(id: string) {
    const room = await joinRoom(id);
    setRooms((prev) => prev.map((r) => (r.id === id ? room : r)));
  }

  async function handleDelete(id: string) {
    await deleteRoom(id);
    setRooms((prev) => prev.filter((r) => r.id !== id));
  }

  const filtered = rooms.filter((room) => {
    if (filter === "mine") return room.is_member;
    if (filter === "public") return room.visibility === "public";
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Salas de estudio"
        description="Pizarras colaborativas en tiempo real con control de roles: propietario, editor y lector."
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancelar" : "Crear sala"}
          </Button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-foreground">Nueva sala</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Repaso — Parcial 2"
              required
            />
            <div>
              <label className="text-sm font-medium text-foreground">
                Visibilidad
              </label>
              <select
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as RoomVisibility)
                }
                className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
              >
                <option value="public">Pública (org)</option>
                <option value="private">Privada (invitación)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Objetivo de la sesión colaborativa..."
                className="mt-1.5 w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <Button type="submit" className="mt-4" disabled={creating}>
            {creating ? "Creando..." : "Crear sala"}
          </Button>
        </form>
      )}

      <div className="mb-6 flex gap-2">
        {(["all", "mine", "public"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary-light text-primary"
                : "text-muted hover:bg-slate-100"
            }`}
          >
            {f === "all" ? "Todas" : f === "mine" ? "Mis salas" : "Públicas"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted">
            No hay salas que coincidan con el filtro seleccionado.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((room) => (
            <article
              key={room.id}
              className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">{room.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {room.description}
                  </p>
                </div>
                <Badge
                  variant={room.visibility === "public" ? "primary" : "default"}
                >
                  {room.visibility === "public" ? "Pública" : "Privada"}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>
                  {room.member_count}/{room.max_members} miembros
                </span>
                {room.role && (
                  <Badge variant="success">{roleLabels[room.role]}</Badge>
                )}
                <span>· {formatDate(room.created_at)}</span>
              </div>

              <div className="mt-auto flex gap-2 pt-4">
                {room.is_member ? (
                  <>
                    <Button variant="primary" className="flex-1">
                      Entrar a la pizarra
                    </Button>
                    {room.role === "owner" && (
                      <Button
                        variant="ghost"
                        className="text-error"
                        onClick={() => handleDelete(room.id)}
                      >
                        Eliminar
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => handleJoin(room.id)}
                  >
                    Unirse a la sala
                  </Button>
                )}
              </div>

              <p className="mt-3 text-[10px] text-muted">
                Colaboración en tiempo real vía WebSocket (/ws/rooms/:id)
              </p>
            </article>
          ))}
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
