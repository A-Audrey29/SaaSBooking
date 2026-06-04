import { devLogin } from "./dev-login.action";

const DEV_ACCOUNTS = [
  { email: "admin@saasbooking.dev", label: "Super Admin", role: "super_admin" },
  { email: "referent1@cs-abymes.gp", label: "Marie Dupont", role: "référent" },
  { email: "jean.dumont@provider.dev", label: "Jean Dumont", role: "prestataire" },
];

export function DevLoginButtons() {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="mt-8 pt-6 border-t border-dashed border-muted">
      <p className="text-xs text-muted-foreground mb-3 font-mono">DEV — connexion rapide</p>
      <div className="space-y-2">
        {DEV_ACCOUNTS.map(({ email, label, role }) => (
          <form key={email} action={devLogin.bind(null, email)}>
            <button
              type="submit"
              className="w-full flex items-center justify-between px-3 py-2 text-sm border rounded-md hover:bg-muted transition-colors text-left"
            >
              <span className="font-medium">{label}</span>
              <span className="text-xs text-muted-foreground font-mono">{role}</span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
