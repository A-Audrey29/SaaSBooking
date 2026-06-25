import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResaPresta",
  description: "Gestion de séances d'ateliers pour centres sociaux",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-4 px-6">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-x-6 gap-y-2 justify-center text-xs text-gray-500">
            <Link href="/legal/mentions-legales" className="hover:text-gray-800 transition-colors">
              Mentions légales
            </Link>
            <Link href="/legal/politique-confidentialite" className="hover:text-gray-800 transition-colors">
              Politique de confidentialité
            </Link>
            <Link href="/legal/cgu" className="hover:text-gray-800 transition-colors">
              Conditions générales d&apos;utilisation
            </Link>
            <span>© {new Date().getFullYear()} FEVES — ResaPresta</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
