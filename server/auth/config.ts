import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
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
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        console.log(`[MAGIC LINK] to=${email} url=${url}`);
      },
      disableSignUp: true,
    }),
  ],
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
