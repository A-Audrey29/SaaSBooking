"use client";

import { AppShell, NavItem } from "@/components/shell/app-shell";
import { authClient } from "@/lib/auth-client";

const items: NavItem[] = [
  {
    href: "/app",
    label: "Mes séances",
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
  {
    href: "/app/availability",
    label: "Disponibilités",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/app/providers",
    label: "Prestataires",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M20 21a8 8 0 1 0-16 0" />
        <circle cx="12" cy="8" r="4" />
      </svg>
    ),
  },
  {
    href: "/app/sessions/new",
    label: "Nouvelle séance",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const userName = session?.user?.name ?? "Référent";

  return (
    <AppShell brand="ResaPresta" spaceLabel="Référent" userName={userName} items={items}>
      {children}
    </AppShell>
  );
}
