import { requireRole } from "@/server/context/server-context";

export default async function AdminPage() {
  await requireRole("super_admin", "project_admin");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Espace Admin</h1>
      <p className="text-muted-foreground">Bienvenue dans l'espace d'administration.</p>
    </div>
  );
}
