import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/shell/avatar";

const ACCOUNTS = [
  { href: "/app",   name: "Marie Cadet",   role: "Référente famille",  label: "Espace Référent" },
  { href: "/admin", name: "Admin Centre",  role: "Administrateur",     label: "Espace Admin" },
  { href: "/pro",   name: "Jean Dumont",   role: "Prestataire",        label: "Espace Prestataire" },
];

export default function DevLoginPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-6">
      <h1 className="text-h-2xl font-semibold tracking-tight text-ink-900">
        Dev — Choisir un espace
      </h1>
      <div className="flex flex-col gap-3 w-72">
        {ACCOUNTS.map(({ href, name, role, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-3 rounded-md bg-ink-900 text-paper hover:opacity-90 transition-opacity"
          >
            <Avatar name={name} size={36} />
            <div className="flex flex-col min-w-0">
              <span className="text-t-sm font-medium leading-tight">{label}</span>
              <span className="text-t-xs opacity-60 truncate">{name} · {role}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
