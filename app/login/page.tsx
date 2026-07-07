import { LoginForm } from "./login-form";
import { DevLoginButtons } from "./dev-login-buttons";

interface LoginPageProps {
  searchParams: Promise<{ reset?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reset } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6">Connexion</h1>
          {reset === "success" && (
            <div className="mb-4 p-3 rounded-md bg-muted text-sm text-muted-foreground">
              Mot de passe mis à jour. Connectez-vous avec votre nouveau mot de passe.
            </div>
          )}
          <LoginForm />
          <DevLoginButtons />
        </div>
      </div>
    </div>
  );
}
