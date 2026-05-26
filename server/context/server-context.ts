/**
 * Server Context - centralized session and authorization.
 *
 * Provides:
 * - getServerContext(): returns { userId, centreId, role } from session
 * - requireRole(): redirects if role not in allowed list
 * - applyCenterScope(): applies centre_id filter to queries (bypass for super_admin)
 */

import { headers } from "next/headers";
import { auth } from "@/server/auth/config";
import { redirect } from "next/navigation";
import { eq, and, isNull } from "drizzle-orm";

export type AppRole = "super_admin" | "project_admin" | "referent" | "provider";

export interface ServerContext {
  userId: string;
  centreId: string | null;
  role: AppRole;
}

/**
 * Get current server context from session.
 */
export async function getServerContext(): Promise<ServerContext | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const user = session.user as unknown as {
    id: string;
    centreId: string | null;
    role: AppRole;
  };

  return {
    userId: user.id,
    centreId: user.centreId,
    role: user.role,
  };
}

/**
 * Require authenticated user, redirect to login if not authenticated.
 */
export async function requireAuth(): Promise<ServerContext> {
  const ctx = await getServerContext();
  if (!ctx) {
    redirect("/login");
  }
  return ctx;
}

/**
 * Require specific role(s), redirect if not authorized.
 */
export async function requireRole(...allowed: AppRole[]): Promise<ServerContext> {
  const ctx = await requireAuth();
  if (!allowed.includes(ctx.role)) {
    redirect("/");
  }
  return ctx;
}

/**
 * Apply center scope to a query.
 * - If user is super_admin, no filter applied (sees all centres)
 * - Otherwise, filters by centreId and excludes soft-deleted records
 *
 * Usage:
 *   const query = db.select().from(centres);
 *   const scopedQuery = applyCenterScope(ctx, query);
 *
 * TODO V1.5: Use proper generic typing with Drizzle.
 */
export function applyCenterScope(
  ctx: ServerContext,
  query: any
): any {
  if (ctx.role === "super_admin") {
    // Super admin sees all, just filter soft deletes
    return query.where((table: any) => {
      if (table.deletedAt) {
        return isNull(table.deletedAt);
      }
      return undefined;
    });
  }

  // Regular users see their centre only
  return query.where((table: any) => {
    if (!table.centreId || !table.deletedAt) return undefined;
    return and(
      eq(table.centreId, ctx.centreId!),
      isNull(table.deletedAt)
    );
  });
}

/**
 * Get default redirect path for user's role.
 */
export function getRedirectForRole(role: AppRole): string {
  switch (role) {
    case "super_admin":
    case "project_admin":
      return "/admin";
    case "referent":
      return "/app";
    case "provider":
      return "/pro";
    default:
      return "/";
  }
}
