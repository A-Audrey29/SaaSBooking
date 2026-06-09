import "server-only";

import { eq, isNull, and, inArray, lte, gte, asc } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export interface ProviderDispoRow {
  providerId: string;
  providerNom: string;
  metierNom: string;
  availabilities: {
    id: string;
    startAt: Date;
    endAt: Date;
    kind: string;
  }[];
}

/**
 * Retourne tous les prestataires actifs filtrés optionnellement par noms de
 * métier, avec leurs disponibilités dans [from, to].
 *
 * En V1 les prestataires ne sont pas contraints à un centre : ils peuvent
 * opérer sur toute la Guadeloupe. On filtre uniquement par métier.
 */
export async function getProvidersDisposForCentre(
  _centreId: string,
  from: Date,
  to: Date,
  metierNoms?: string[]
): Promise<ProviderDispoRow[]> {
  // 1. Prestataires actifs, filtrés par métier si précisé
  const providerWhere = metierNoms && metierNoms.length > 0
    ? and(isNull(schema.provider.deletedAt), inArray(schema.metier.nom, metierNoms))
    : isNull(schema.provider.deletedAt);

  const providers = await db
    .select({
      providerId: schema.provider.id,
      providerNom: schema.provider.nom,
      metierNom: schema.metier.nom,
    })
    .from(schema.provider)
    .innerJoin(schema.metier, eq(schema.provider.metierId, schema.metier.id))
    .where(providerWhere)
    .orderBy(schema.metier.nom, schema.provider.nom);

  if (providers.length === 0) return [];

  const providerIds = providers.map((p) => p.providerId);

  // 2. Dispos dans la fenêtre [from, to]
  const dispos = await db
    .select({
      id: schema.providerAvailability.id,
      providerId: schema.providerAvailability.providerId,
      startAt: schema.providerAvailability.startAt,
      endAt: schema.providerAvailability.endAt,
      kind: schema.providerAvailability.kind,
    })
    .from(schema.providerAvailability)
    .where(
      and(
        inArray(schema.providerAvailability.providerId, providerIds),
        isNull(schema.providerAvailability.deletedAt),
        lte(schema.providerAvailability.startAt, to),
        gte(schema.providerAvailability.endAt, from)
      )
    )
    .orderBy(asc(schema.providerAvailability.startAt));

  // 3. Assembler
  const disposByProvider = new Map<string, typeof dispos>();
  for (const d of dispos) {
    const list = disposByProvider.get(d.providerId) ?? [];
    list.push(d);
    disposByProvider.set(d.providerId, list);
  }

  return providers.map((p) => ({
    providerId: p.providerId,
    providerNom: p.providerNom,
    metierNom: p.metierNom ?? "",
    availabilities: disposByProvider.get(p.providerId) ?? [],
  }));
}
