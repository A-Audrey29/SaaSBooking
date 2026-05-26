import { notFound } from "next/navigation";
import Link from "next/link";

export default function DevLoginPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-6">
      <h1 className="text-h-2xl font-semibold tracking-tight text-ink-900">
        Dev — Choisir un espace
      </h1>
      <div className="flex flex-col gap-3 w-56">
        <Link
          href="/app"
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-ink-900 text-paper text-t-sm font-medium hover:opacity-90 transition-opacity"
        >
          Espace Référent
        </Link>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-ink-900 text-paper text-t-sm font-medium hover:opacity-90 transition-opacity"
        >
          Espace Admin
        </Link>
        <Link
          href="/pro"
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-ink-900 text-paper text-t-sm font-medium hover:opacity-90 transition-opacity"
        >
          Espace Prestataire
        </Link>
      </div>
    </div>
  );
}
