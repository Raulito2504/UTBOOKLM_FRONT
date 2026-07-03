import { apiClient } from "@/src/lib/api/client";
import { USE_MOCK_DATA } from "@/src/lib/api/config";
import {
  createMockRoom,
  getMockRooms,
  joinMockRoom,
  removeMockRoom,
} from "@/src/lib/mock/rooms";
import { delay } from "@/src/lib/utils/delay";
import type {
  CreateRoomRequest,
  RoomListResponse,
  StudyRoom,
} from "@/src/types/rooms";

/** GET /api/v1/rooms */
export async function listRooms(): Promise<RoomListResponse> {
  if (USE_MOCK_DATA) {
    await delay(250);
    const items = getMockRooms();
    return { items, total: items.length };
  }
  return apiClient<RoomListResponse>("/rooms");
}

/** POST /api/v1/rooms */
export async function createRoom(
  request: CreateRoomRequest,
): Promise<StudyRoom> {
  if (USE_MOCK_DATA) {
    await delay(400);
    return createMockRoom(request);
  }
  return apiClient<StudyRoom>("/rooms", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/** POST /api/v1/rooms/:room_id/join */
export async function joinRoom(id: string): Promise<StudyRoom> {
  if (USE_MOCK_DATA) {
    await delay(300);
    const room = joinMockRoom(id);
    if (!room) throw new Error("Sala no encontrada");
    return room;
  }
  return apiClient<StudyRoom>(`/rooms/${id}/join`, { method: "POST" });
}

/** DELETE /api/v1/rooms/:room_id */
export async function deleteRoom(id: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await delay(200);
    removeMockRoom(id);
    return;
  }
  await apiClient<void>(`/rooms/${id}`, { method: "DELETE" });
}

/** GET /api/v1/rooms/:room_id */
export async function getRoom(id: string): Promise<StudyRoom> {
  if (USE_MOCK_DATA) {
    await delay(200);
    const room = getMockRooms().find((r) => r.id === id);
    if (!room) throw new Error("Sala no encontrada");
    return room;
  }
  return apiClient<StudyRoom>(`/rooms/${id}`);
}
