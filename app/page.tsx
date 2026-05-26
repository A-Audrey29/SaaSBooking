import { getServerContext } from "@/server/context/server-context";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const ctx = await getServerContext();

  if (ctx) {
    const { getRedirectForRole } = await import("@/server/context/server-context");
    redirect(getRedirectForRole(ctx.role));
  }

  // Not logged in - show landing page
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">SaaS Booking</h1>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Gestion de séances d'ateliers pour centres sociaux
      </p>
      <a
        href="/login"
        className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
      >
        Se connecter
      </a>
    </div>
  );
}
