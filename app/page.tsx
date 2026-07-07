import { getServerContext } from "@/server/context/server-context";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function HomePage() {
  const ctx = await getServerContext();

  if (ctx) {
    const { getRedirectForRole } = await import("@/server/context/server-context");
    redirect(getRedirectForRole(ctx.role));
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--paper)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-feves.jpg"
            alt="Logo FEVES"
            width={48}
            height={48}
            className="rounded"
          />
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--ink-500)" }}>
              Une initiative de la
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--ink-700)" }}>
              FEVES Guadeloupe &amp; St Martin
            </p>
          </div>
        </div>
        <a
          href="/login"
          className="px-4 py-1.5 text-sm rounded-md font-medium transition-opacity hover:opacity-80"
          style={{ background: "var(--brand)", color: "white" }}
        >
          Se connecter
        </a>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        <div className="mb-8">
          <Image
            src="/logo-feves.jpg"
            alt="FEVES"
            width={96}
            height={96}
            className="mx-auto rounded-xl shadow-sm"
          />
        </div>

        <h1
          className="text-5xl font-bold tracking-tight mb-3"
          style={{ color: "var(--ink-900)" }}
        >
          ResaPresta
        </h1>
        <p
          className="text-lg font-medium mb-6"
          style={{ color: "var(--brand-ink)" }}
        >
          La plateforme de coordination ateliers des centres sociaux
        </p>

        <p
          className="max-w-xl text-base leading-relaxed mb-10"
          style={{ color: "var(--ink-500)" }}
        >
          ResaPresta simplifie la mise en relation entre les centres sociaux de
          la Fédération des Espaces de Vie et cEntres Sociaux (FEVES) et leurs
          prestataires d&apos;ateliers. Planification des séances, suivi des
          intervenants et coordination multi-sites : tout est centralisé en un
          seul outil, conçu pour le réseau guadeloupéen.
        </p>

        <a
          href="/login"
          className="px-8 py-3 rounded-lg text-base font-semibold shadow-sm transition-opacity hover:opacity-90"
          style={{ background: "var(--brand)", color: "white" }}
        >
          Accéder à la plateforme
        </a>
      </main>
    </div>
  );
}
