/**
 * Better Auth configuration.
 *
 * - Email/password authentication (dev testing)
 * - Drizzle adapter for session storage
 * - Extended user model with centre_id and role
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { InferSelectModel } from "drizzle-orm";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";

type DbUser = InferSelectModel<typeof schema.user>;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true, // Enable for dev testing without email
  },
  emailVerification: {
    sendOnSignUp: false,
  },
  // Email plugin disabled for dev - enable with Resend later
  // plugins: [
  //   resend({
  //     apiKey: process.env.RESEND_API_KEY || "",
  //     from: process.env.RESEND_FROM_EMAIL || "noreply@localhost",
  //   }),
  // ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    cookiePrefix: "saas_booking",
  },
  account: {
    accountLinking: {
      enabled: false,
    },
  },
  callbacks: {
    async signIn({ user }: { user: DbUser }) {
      // Reject sign-in if user is soft-deleted
      const hasDeleted = "deletedAt" in user && user.deletedAt !== null;
      if (hasDeleted) {
        return false;
      }
      return true;
    },
  },
});

export type Session = typeof auth.$Infer.Session;
