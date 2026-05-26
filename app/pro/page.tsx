import { requireRole } from "@/server/context/server-context";

export default async function ProviderPage() {
  await requireRole("provider");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Espace Prestataire</h1>
      <p className="text-muted-foreground">Bienvenue dans l'espace prestataire.</p>
    </div>
  );
}
