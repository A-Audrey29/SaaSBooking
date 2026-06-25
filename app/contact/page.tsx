"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { authClient } from "@/lib/auth-client";
import { sendContact } from "./contact.action";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  project_admin: "Admin Projet",
  referent: "Référent",
  provider: "Prestataire",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 text-sm font-medium"
    >
      {pending ? "Envoi en cours..." : "Envoyer le message"}
    </button>
  );
}

export default function ContactPage() {
  const { data: session } = authClient.useSession();
  const [state, action] = useActionState(sendContact, undefined);

  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string }
    | undefined;

  const name = user?.name ?? "";
  const email = user?.email ?? "";
  const roleLabel = ROLE_LABELS[user?.role ?? ""] ?? user?.role ?? "";

  if (state?.success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="p-6 rounded-lg bg-green-50 border border-green-200 text-center space-y-2">
          <p className="text-green-800 font-medium">Message envoyé !</p>
          <p className="text-green-700 text-sm">
            L&apos;équipe pôle-IT FEVES a bien reçu votre message et vous répondra dès que possible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold text-ink-900 mb-1">Contacter le pôle IT</h1>
      <p className="text-sm text-ink-500 mb-6">
        Une question, un problème ou une suggestion ? Écrivez-nous.
      </p>

      <form action={action} className="space-y-5">
        {/* Champs préremplis (lecture seule) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Nom</label>
            <input
              type="text"
              value={name}
              readOnly
              className="w-full px-3 py-2 border rounded-md bg-ink-50 text-ink-500 text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Rôle</label>
            <input
              type="text"
              value={roleLabel}
              readOnly
              className="w-full px-3 py-2 border rounded-md bg-ink-50 text-ink-500 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full px-3 py-2 border rounded-md bg-ink-50 text-ink-500 text-sm cursor-not-allowed"
          />
        </div>

        {/* Champs à saisir */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-ink-700 mb-1">
            Objet <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            maxLength={200}
            placeholder="Ex : Problème de connexion, suggestion..."
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {state?.fieldErrors?.subject && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.subject[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-ink-700 mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            maxLength={5000}
            placeholder="Décrivez votre demande en détail..."
            className="w-full px-3 py-2 border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {state?.fieldErrors?.message && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.message[0]}</p>
          )}
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
