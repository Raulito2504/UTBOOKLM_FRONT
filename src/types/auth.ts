export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  org_id: string | null;
  role: "owner" | "admin" | "member";
  created_at: string;
}
