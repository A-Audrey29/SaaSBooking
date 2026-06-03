/**
 * Auth client for client-side operations.
 *
 * Uses createAuthClient from Better Auth.
 */

import { createAuthClient } from "better-auth/client";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [magicLinkClient()],
});

export type AuthClient = typeof authClient;
