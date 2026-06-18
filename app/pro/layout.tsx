"use client";

import { AppShell, NavItem } from "@/components/shell/app-shell";
import { authClient } from "@/lib/auth-client";

const items: NavItem[] = [
  {
    href: "/pro",
    label: "Demandes",
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M22 12h-6l-2 3H8l-2-3H2" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
  },
  {
    href: "/pro/dispos",
    label: "Mes dispos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/pro/missions",
    label: "Missions",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <path d="M12 12v4M10 14h4" />
      </svg>
    ),
  },
  {
    href: "/pro/profile",
    label: "Profil",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <circle cx="12" cy="12" r="10" />
        <path d="M20 21a8 8 0 1 0-16 0" />
        <circle cx="12" cy="9" r="3" />
      </svg>
    ),
  },
];

export default function ProLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const userName = session?.user?.name ?? "Prestataire";

  return (
    <AppShell brand="ResaPresta" spaceLabel="Prestataire" userName={userName} items={items}>
      {children}
    </AppShell>
  );
}
