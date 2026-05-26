/**
 * Auth client for client-side operations.
 *
 * Uses createAuthClient from Better Auth.
 */

import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export type AuthClient = typeof authClient;
