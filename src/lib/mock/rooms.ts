import type { CreateRoomRequest, StudyRoom } from "@/src/types/rooms";

export const mockRooms: StudyRoom[] = [
  {
    id: "room_001",
    name: "Repaso — Matemáticas Discretas",
    description: "Sesión grupal para repasar grafos y árboles antes del parcial.",
    visibility: "public",
    member_count: 6,
    max_members: 20,
    role: "owner",
    is_member: true,
    created_at: "2026-06-20T18:00:00Z",
  },
  {
    id: "room_002",
    name: "Proyecto UTBookLM — Sprint 3",
    description: "Pizarra colaborativa para diseño de endpoints y frontend.",
    visibility: "private",
    member_count: 4,
    max_members: 20,
    role: "editor",
    is_member: true,
    created_at: "2026-06-22T10:00:00Z",
  },
  {
    id: "room_003",
    name: "Bases de Datos — Normalización",
    description: "Resolver ejercicios de formas normales en equipo.",
    visibility: "public",
    member_count: 3,
    max_members: 20,
    role: null,
    is_member: false,
    created_at: "2026-06-25T14:30:00Z",
  },
  {
    id: "room_004",
    name: "Flashcards en vivo",
    description: "Repaso rápido de flashcards generadas por IA.",
    visibility: "public",
    member_count: 8,
    max_members: 20,
    role: null,
    is_member: false,
    created_at: "2026-06-28T20:00:00Z",
  },
];

let roomsStore = [...mockRooms];

export function getMockRooms(): StudyRoom[] {
  return [...roomsStore];
}

export function createMockRoom(request: CreateRoomRequest): StudyRoom {
  const room: StudyRoom = {
    id: `room_${Date.now()}`,
    name: request.name,
    description: request.description,
    visibility: request.visibility,
    member_count: 1,
    max_members: 20,
    role: "owner",
    is_member: true,
    created_at: new Date().toISOString(),
  };
  roomsStore = [room, ...roomsStore];
  return room;
}

export function joinMockRoom(id: string): StudyRoom | null {
  const index = roomsStore.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const room = roomsStore[index];
  if (room.is_member) return room;

  const updated: StudyRoom = {
    ...room,
    is_member: true,
    role: "reader",
    member_count: room.member_count + 1,
  };
  roomsStore[index] = updated;
  return updated;
}

export function removeMockRoom(id: string): boolean {
  const before = roomsStore.length;
  roomsStore = roomsStore.filter((r) => r.id !== id);
  return roomsStore.length < before;
}
