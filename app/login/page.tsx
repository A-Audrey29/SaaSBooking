import { LoginForm } from "./login-form";
import { DevLoginButtons } from "./dev-login-buttons";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Connexion</h1>
        <LoginForm />
        <DevLoginButtons />
      </div>
    </div>
  );
}
