"use client";

import { usePathname } from "next/navigation";
import { MobileNav } from "@/src/components/layout/mobile-nav";
import { Sidebar } from "@/src/components/layout/sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPath={pathname} />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav currentPath={pathname} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
