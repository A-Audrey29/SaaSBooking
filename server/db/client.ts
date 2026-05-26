/**
 * Database client singleton for server-side use.
 * All queries should go through repositories that apply center_id scope.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// Re-export schemas with correct path resolution
export * as schema from "./schema";
