"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login } from "./login.action";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Connexion..." : "Se connecter"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="password" className="block text-sm font-medium">
            Mot de passe
          </label>
          <Link href="/forgot-password" className="text-sm text-muted-foreground hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
