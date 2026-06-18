import { SetupPasswordClient } from "./setup-password-client";

interface SetupPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function SetupPasswordPage({
  searchParams,
}: SetupPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-semibold">Lien invalide</h1>
          <p className="text-muted-foreground">
            Ce lien d&apos;invitation est manquant ou invalide. Contactez votre
            administrateur pour recevoir une nouvelle invitation.
          </p>
        </div>
      </div>
    );
  }

  return <SetupPasswordClient token={token} />;
}
