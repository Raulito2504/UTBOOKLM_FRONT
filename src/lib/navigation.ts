export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "◫" },
  { label: "Documentos", href: "/documents", icon: "▤" },
  { label: "Consulta RAG", href: "/rag", icon: "◉" },
  { label: "Flashcards", href: "/flashcards", icon: "▢" },
  { label: "Rachas", href: "/streaks", icon: "▲" },
  { label: "Salas", href: "/rooms", icon: "⬡" },
  { label: "Web Tour", href: "/webtour", icon: "◎" },
];
