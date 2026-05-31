import "server-only";
"use server";

import { auth } from "@/server/auth/config";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ROLE_REDIRECTS: Record<string, string> = {
  "referent1@cs-abymes.gp": "/app",
  "admin@saasbooking.dev": "/admin",
  "jean.dumont@cs-abymes.gp": "/pro",
};

export async function devLogin(email: string): Promise<never> {
  if (process.env.NODE_ENV !== "development") throw new Error("Forbidden");

  const response = await auth.api.signInEmail({
    body: { email, password: "dev_seed_2026" },
    asResponse: true,
  });

  if (!response.ok) {
    throw new Error(`Dev login failed for ${email}: ${response.status}`);
  }

  // Forward Set-Cookie headers from Better Auth to the Next.js response
  const cookieStore = await cookies();
  for (const raw of response.headers.getSetCookie()) {
    const nameValue = (raw.split(";")[0] ?? "").trim();
    const eq = nameValue.indexOf("=");
    if (eq === -1) continue;
    const name = nameValue.slice(0, eq).trim();
    const value = nameValue.slice(eq + 1).trim();
    if (!name) continue;
    cookieStore.set(name, value, { path: "/", httpOnly: true, sameSite: "lax" });
  }

  redirect(ROLE_REDIRECTS[email] ?? "/");
}
