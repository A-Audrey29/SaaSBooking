import { requireRole } from "@/server/context/server-context";

export default async function ReferentPage() {
  await requireRole("referent");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Espace Référent</h1>
      <p className="text-muted-foreground">Bienvenue dans l'espace référent.</p>
    </div>
  );
}
