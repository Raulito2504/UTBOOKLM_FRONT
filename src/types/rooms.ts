export type RoomVisibility = "public" | "private";
export type RoomRole = "owner" | "editor" | "reader";

export interface StudyRoom {
  id: string;
  name: string;
  description: string;
  visibility: RoomVisibility;
  member_count: number;
  max_members: number;
  role: RoomRole | null;
  is_member: boolean;
  created_at: string;
}

export interface RoomListResponse {
  items: StudyRoom[];
  total: number;
}

export interface CreateRoomRequest {
  name: string;
  description: string;
  visibility: RoomVisibility;
}
