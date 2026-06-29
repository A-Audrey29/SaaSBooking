import Link from "next/link";

export function LegalFooter() {
  return (
    <footer className="py-4 text-center border-t border-ink-150 bg-white">
      <p className="text-xs text-ink-400 flex flex-wrap justify-center gap-x-4 gap-y-1">
        <Link href="/cgu" className="hover:underline hover:text-ink-600 transition-colors">
          CGU
        </Link>
        <Link href="/mentions-legales" className="hover:underline hover:text-ink-600 transition-colors">
          Mentions légales
        </Link>
        <Link href="/confidentialite" className="hover:underline hover:text-ink-600 transition-colors">
          Politique de confidentialité
        </Link>
      </p>
    </footer>
  );
}
