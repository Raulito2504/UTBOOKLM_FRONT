"use client";

import { usePathname } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isNotebookExperience = pathname.startsWith("/notebooks");

  if (isNotebookExperience) {
    return <div className="min-h-screen bg-[#111417]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="min-h-screen overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
