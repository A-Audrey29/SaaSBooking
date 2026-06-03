import "server-only";

import { db, schema } from "@/server/db/client";
import type { ServerContext } from "@/server/context/server-context";

/**
 * Log an audit entry for a mutation.
 *
 * @param ctx - Server context (userId, centreId, role)
 * @param action - Type of action performed
 * @param entityType - Table name (e.g., "centre", "project", "user")
 * @param entityId - UUID of the entity
 * @param before - State before mutation (null for create)
 * @param after - State after mutation (null for soft_delete)
 *
 * Rules for centreId:
 * - For centre entities: use entityId (the centre being acted upon)
 * - For other entities: use ctx.centreId (the centre the entity belongs to)
 */
export async function logAudit(
  ctx: ServerContext,
  action: "create" | "update" | "soft_delete",
  entityType: string,
  entityId: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): Promise<void> {
  const centreId = entityType === "centre" ? entityId : ctx.centreId;

  if (!centreId) {
    throw new Error(
      `logAudit: centreId cannot be null for entityType=${entityType}, action=${action}`
    );
  }

  await db.insert(schema.auditLog).values({
    centreId,
    userId: ctx.userId,
    action,
    entityType,
    entityId,
    before,
    after,
  });
}
