import { ApiError, apiClient } from "@/src/lib/api/client";
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

export async function listRooms(): Promise<RoomListResponse> {
  if (USE_MOCK_DATA) return mockRoomList();
  try {
    return await apiClient<RoomListResponse>("/rooms");
  } catch (error) {
    if (isUnavailable(error)) return mockRoomList();
    throw error;
  }
}

export async function createRoom(
  request: CreateRoomRequest,
): Promise<StudyRoom> {
  if (USE_MOCK_DATA) return createMockRoomAfterDelay(request);
  try {
    return await apiClient<StudyRoom>("/rooms", {
      method: "POST",
      body: JSON.stringify(request),
    });
  } catch (error) {
    if (isUnavailable(error)) return createMockRoomAfterDelay(request);
    throw error;
  }
}

export async function joinRoom(id: string): Promise<StudyRoom> {
  if (USE_MOCK_DATA) return joinMockRoomAfterDelay(id);
  try {
    return await apiClient<StudyRoom>(`/rooms/${id}/join`, { method: "POST" });
  } catch (error) {
    if (isUnavailable(error)) return joinMockRoomAfterDelay(id);
    throw error;
  }
}

export async function deleteRoom(id: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await delay(200);
    removeMockRoom(id);
    return;
  }
  try {
    await apiClient<void>(`/rooms/${id}`, { method: "DELETE" });
  } catch (error) {
    if (!isUnavailable(error)) throw error;
  }
}

export async function getRoom(id: string): Promise<StudyRoom> {
  if (USE_MOCK_DATA) return getMockRoomAfterDelay(id);
  try {
    return await apiClient<StudyRoom>(`/rooms/${id}`);
  } catch (error) {
    if (isUnavailable(error)) return getMockRoomAfterDelay(id);
    throw error;
  }
}

async function mockRoomList(): Promise<RoomListResponse> {
  await delay(250);
  const items = getMockRooms();
  return { items, total: items.length };
}

async function createMockRoomAfterDelay(request: CreateRoomRequest): Promise<StudyRoom> {
  await delay(400);
  return createMockRoom(request);
}

async function joinMockRoomAfterDelay(id: string): Promise<StudyRoom> {
  await delay(300);
  const room = joinMockRoom(id);
  if (!room) throw new Error("Sala no encontrada");
  return room;
}

async function getMockRoomAfterDelay(id: string): Promise<StudyRoom> {
  await delay(200);
  const room = getMockRooms().find((item) => item.id === id);
  if (!room) throw new Error("Sala no encontrada");
  return room;
}

function isUnavailable(error: unknown): boolean {
  return error instanceof ApiError && [404, 405].includes(error.status);
}
