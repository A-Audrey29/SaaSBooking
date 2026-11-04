import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq, type InferSelectModel } from "drizzle-orm";
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
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "referent",
        input: false,
      },
      centreId: {
        type: "string",
        required: false,
        defaultValue: null,
        input: false,
      },
    },
  },
  plugins: [],
  databaseHooks: {
    session: {
      create: {
        // A new session row = a successful login. Record it for /admin/users.
        // Wrapped in try/catch: a failure here must never block the login itself.
        after: async (session) => {
          try {
            await db
              .update(schema.user)
              .set({ lastLoginAt: new Date() })
              .where(eq(schema.user.id, session.userId));
          } catch (e) {
            console.error("[auth] Échec mise à jour last_login_at", {
              userId: session.userId,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        },
      },
    },
  },
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
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
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
