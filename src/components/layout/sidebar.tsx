import Link from "next/link";
import { mainNavItems } from "@/src/lib/navigation";

interface SidebarProps {
  currentPath: string;
}

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
          UT
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">UTBookLM</p>
          <p className="text-xs text-muted">Panel de estudio</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {mainNavItems.map((item) => {
          const isActive =
            currentPath === item.href ||
            (item.href !== "/dashboard" && currentPath.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-light text-primary"
                  : "text-muted hover:bg-slate-50 hover:text-foreground"
              }`}
            >
              <span className="w-5 text-center text-base" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <p className="text-xs text-muted">
          Proyecto académico · Cuatrimestre 2026
        </p>
      </div>
    </aside>
  );
}
