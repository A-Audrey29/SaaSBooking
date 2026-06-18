import { eq, isNull, and, count } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

// Projets visibles par un centre (via la table de liaison project_centre).
export async function listProjects(centreId: string) {
  return db
    .select({
      id: schema.project.id,
      nom: schema.project.nom,
      description: schema.project.description,
      financeur: schema.project.financeur,
      startDate: schema.project.startDate,
      endDate: schema.project.endDate,
      createdAt: schema.project.createdAt,
    })
    .from(schema.project)
    .innerJoin(
      schema.projectCentre,
      eq(schema.projectCentre.projectId, schema.project.id)
    )
    .where(
      and(
        eq(schema.projectCentre.centreId, centreId),
        isNull(schema.project.deletedAt)
      )
    )
    .orderBy(schema.project.nom);
}

// Tous les projets (super_admin) avec la liste des centres participants.
export async function listAllProjects() {
  const rows = await db
    .select({
      id: schema.project.id,
      nom: schema.project.nom,
      description: schema.project.description,
      financeur: schema.project.financeur,
      startDate: schema.project.startDate,
      endDate: schema.project.endDate,
      createdAt: schema.project.createdAt,
      centreId: schema.projectCentre.centreId,
      centreNom: schema.centre.nom,
    })
    .from(schema.project)
    .leftJoin(
      schema.projectCentre,
      eq(schema.projectCentre.projectId, schema.project.id)
    )
    .leftJoin(schema.centre, eq(schema.centre.id, schema.projectCentre.centreId))
    .where(isNull(schema.project.deletedAt))
    .orderBy(schema.project.nom);

  // Regrouper les lignes par projet (1 ligne par centre participant)
  const projectsMap = new Map<
    string,
    {
      id: string;
      nom: string;
      description: string | null;
      financeur: string | null;
      startDate: string | null;
      endDate: string | null;
      createdAt: Date;
      centres: { id: string; nom: string }[];
    }
  >();

  for (const row of rows) {
    if (!projectsMap.has(row.id)) {
      projectsMap.set(row.id, {
        id: row.id,
        nom: row.nom,
        description: row.description,
        financeur: row.financeur,
        startDate: row.startDate,
        endDate: row.endDate,
        createdAt: row.createdAt,
        centres: [],
      });
    }
    if (row.centreId && row.centreNom) {
      projectsMap.get(row.id)!.centres.push({ id: row.centreId, nom: row.centreNom });
    }
  }

  return Array.from(projectsMap.values());
}

export async function getProjectById(id: string) {
  const rows = await db
    .select({
      id: schema.project.id,
      nom: schema.project.nom,
      description: schema.project.description,
      financeur: schema.project.financeur,
      startDate: schema.project.startDate,
      endDate: schema.project.endDate,
      createdAt: schema.project.createdAt,
      updatedAt: schema.project.updatedAt,
      centreId: schema.projectCentre.centreId,
      centreNom: schema.centre.nom,
    })
    .from(schema.project)
    .leftJoin(
      schema.projectCentre,
      eq(schema.projectCentre.projectId, schema.project.id)
    )
    .leftJoin(schema.centre, eq(schema.centre.id, schema.projectCentre.centreId))
    .where(and(eq(schema.project.id, id), isNull(schema.project.deletedAt)));

  if (rows.length === 0) return null;

  const first = rows[0];
  const centres = rows
    .filter((r) => r.centreId && r.centreNom)
    .map((r) => ({ id: r.centreId!, nom: r.centreNom! }));

  return {
    id: first.id,
    nom: first.nom,
    description: first.description,
    financeur: first.financeur,
    startDate: first.startDate,
    endDate: first.endDate,
    createdAt: first.createdAt,
    updatedAt: first.updatedAt,
    centres,
  };
}

export async function getProjectKpis(projectId: string) {
  const [workshopRow] = await db
    .select({ total: count() })
    .from(schema.workshop)
    .where(and(eq(schema.workshop.projectId, projectId), isNull(schema.workshop.deletedAt)));

  const [providerRow] = await db
    .select({ total: count() })
    .from(schema.providerAssignment)
    .where(
      and(
        eq(schema.providerAssignment.projectId, projectId),
        isNull(schema.providerAssignment.deletedAt)
      )
    );

  return {
    workshopCount: workshopRow?.total ?? 0,
    providerCount: providerRow?.total ?? 0,
  };
}
