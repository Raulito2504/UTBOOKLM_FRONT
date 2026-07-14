import { GuestRoute } from "@/src/features/auth/guards";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <GuestRoute>{children}</GuestRoute>;
}
