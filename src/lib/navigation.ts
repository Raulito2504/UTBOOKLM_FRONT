export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const mainNavItems: NavItem[] = [
  { label: "Mis cuadernos", href: "/notebooks", icon: "N" },
  { label: "Documentos", href: "/documents", icon: "F" },
  { label: "Consulta RAG", href: "/rag", icon: "R" },
  { label: "Práctica", href: "/flashcards", icon: "P" },
  { label: "Rachas", href: "/streaks", icon: "S" },
  { label: "Salas", href: "/rooms", icon: "G" },
  { label: "Web Tour", href: "/webtour", icon: "W" },
];
