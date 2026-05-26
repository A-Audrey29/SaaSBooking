"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "./avatar";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  exact?: boolean;
}

export interface AppShellProps {
  brand: string;
  spaceLabel: string;
  userName: string;
  items: NavItem[];
  children: React.ReactNode;
}

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({ brand, spaceLabel, userName, items, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 bg-sidebar border-r border-ink-150 z-30">
        {/* Brand */}
        <Link href="/" className="flex flex-col px-5 pt-5 pb-4 hover:opacity-80 transition-opacity">
          <span className="text-h-sm font-semibold text-ink-900">{brand}</span>
          <span className="text-t-xs text-ink-400 uppercase tracking-wider mt-0.5">{spaceLabel}</span>
        </Link>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {items.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-t-sm transition-colors",
                  active
                    ? "bg-ink-50 text-ink-900 font-medium"
                    : "text-ink-500 hover:bg-ink-50 hover:text-ink-700",
                ].join(" ")}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-brand text-paper text-t-xs font-medium">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-ink-150 px-3 py-3 space-y-1">
          <Link
            href="/"
            className="block px-2.5 py-1.5 text-t-sm text-ink-500 hover:text-ink-700 rounded-md hover:bg-ink-50 transition-colors"
          >
            Changer d&apos;espace
          </Link>
          <Link
            href="/account"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-ink-50 transition-colors"
          >
            <Avatar name={userName} size={24} />
            <span className="text-t-sm text-ink-700 truncate">{userName}</span>
          </Link>
        </div>
      </aside>

      {/* ── Mobile topbar ── */}
      <header className="md:hidden fixed top-0 inset-x-0 h-12 bg-sidebar border-b border-ink-150 z-30 flex items-center justify-between px-4">
        <Link href="/" className="text-h-sm font-semibold text-ink-900">
          {brand}
        </Link>
        <Link href="/account">
          <Avatar name={userName} size={28} />
        </Link>
      </header>

      {/* ── Main content ── */}
      <main className="md:ml-60 pt-12 md:pt-0 pb-16 md:pb-0 min-h-screen">
        {children}
      </main>

      {/* ── Mobile tabbar ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-14 bg-sidebar border-t border-ink-150 z-30 flex items-center">
        {items.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors",
                active ? "text-ink-900" : "text-ink-400",
              ].join(" ")}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="text-t-xs leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
