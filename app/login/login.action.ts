"use server";

import { auth } from "@/server/auth/config";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ROLE_REDIRECTS: Record<string, string> = {
  super_admin: "/admin",
  project_admin: "/admin",
  referent: "/app",
  provider: "/pro",
};

export async function login(
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | never> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Email ou mot de passe invalide." };
  }

  const { email, password } = parsed.data;

  const response = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });

  if (!response.ok) {
    return { error: "Email ou mot de passe incorrect." };
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
    cookieStore.set(name, decodeURIComponent(value), { path: "/", httpOnly: true, sameSite: "lax" });
  }

  // Read role from session to determine redirect
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | null)?.role ?? "referent";

  redirect(ROLE_REDIRECTS[role] ?? "/app");
}
