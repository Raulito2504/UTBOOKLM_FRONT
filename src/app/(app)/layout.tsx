import { AppShell } from "@/src/components/layout/app-shell";
import { PrivateRoute } from "@/src/features/auth/guards";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PrivateRoute><AppShell>{children}</AppShell></PrivateRoute>;
}
