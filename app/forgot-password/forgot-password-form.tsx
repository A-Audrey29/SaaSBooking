"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordReset } from "./forgot-password.action";

type ActionState = { sent: true } | undefined;

async function formAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  await requestPasswordReset(email);
  // Toujours afficher le message de succès générique (pas d'énumération)
  return { sent: true };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Envoi en cours..." : "Envoyer le lien"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(formAction, undefined);

  if (state?.sent) {
    return (
      <div className="p-4 rounded-md bg-muted text-sm">
        Si cet email est enregistré dans ResaPresta, vous recevrez un lien de réinitialisation dans quelques minutes.
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Adresse email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full px-3 py-2 border rounded-md"
          placeholder="votre@email.fr"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
