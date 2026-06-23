import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
          <p className="text-sm text-muted-foreground">
            Entrez votre adresse email pour recevoir un lien de réinitialisation.
          </p>
        </div>
        <ForgotPasswordForm />
        <div className="text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
