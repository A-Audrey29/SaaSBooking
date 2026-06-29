import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — ResaPresta",
};

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-sm text-gray-800">
      <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 mb-8 inline-block">
        ← Retour
      </Link>

      <h1 className="text-2xl font-bold mb-8">Mentions légales — ResaPresta</h1>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">1. Identification de l&apos;éditeur du site</h2>
        <dl className="space-y-1">
          <div className="flex gap-2"><dt className="font-medium min-w-fit">Statut :</dt><dd>Association</dd></div>
          <div className="flex gap-2"><dt className="font-medium min-w-fit">Dénomination sociale :</dt><dd>Fédération des espaces et des centres sociaux de Guadeloupe et Saint-Martin (FEVES)</dd></div>
          <div className="flex gap-2"><dt className="font-medium min-w-fit">Forme juridique :</dt><dd>Association loi 1901</dd></div>
          <div className="flex gap-2"><dt className="font-medium min-w-fit">Adresse du siège social :</dt><dd>28 rue Léon Blum, 97111 Morne-à-l&apos;Eau</dd></div>
          <div className="flex gap-2"><dt className="font-medium min-w-fit">Contact :</dt><dd><a href="mailto:cap-cd@fevesguadeloupeetsaint.org" className="underline hover:text-gray-600">cap-cd@fevesguadeloupeetsaint.org</a></dd></div>
          <div className="flex gap-2"><dt className="font-medium min-w-fit">Directrice de la publication :</dt><dd>Françoise GACE (Présidente)</dd></div>
          <div className="flex gap-2"><dt className="font-medium min-w-fit">Numéro SIRET :</dt><dd>921 972 592 00023</dd></div>
          <div className="flex gap-2"><dt className="font-medium min-w-fit">TVA intracommunautaire :</dt><dd>Non applicable</dd></div>
        </dl>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">2. Nom de domaine et hébergement</h2>
        <p className="mb-3">La plateforme ResaPresta est accessible à l&apos;adresse <strong>resapresta.fr</strong>.</p>
        <div className="space-y-3">
          <div>
            <p className="font-medium">Nom de domaine</p>
            <p>o2switch — 222 Boulevard Gustave Flaubert, 63000 Clermont-Ferrand, France</p>
          </div>
          <div>
            <p className="font-medium">Hébergement applicatif</p>
            <p>Render Services, Inc. — 525 Brannan Street, Ste 300, San Francisco, CA 94107, États-Unis</p>
          </div>
          <div>
            <p className="font-medium">Hébergement de la base de données</p>
            <p>Neon, LLC (A Databricks Company) — 160 Spear Street, 15th Floor, San Francisco, CA 94105, États-Unis</p>
          </div>
          <div>
            <p className="font-medium">Envoi des emails transactionnels</p>
            <p>Plus Five Five, Inc. (Resend) — 2261 Market Street #5039, San Francisco, CA 94114, États-Unis</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">3. Propriété intellectuelle</h2>
        <p className="mb-2">
          Tous les contenus présents sur la plateforme ResaPresta (textes, documents, logos, éléments graphiques, etc.)
          sont protégés par le droit d&apos;auteur et, plus largement, par le droit de la propriété intellectuelle.
        </p>
        <p>
          Toute reproduction, distribution, modification, adaptation, retransmission ou publication, totale ou partielle,
          est interdite sans l&apos;accord écrit préalable de la FEVES.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">4. Responsabilité</h2>
        <p className="mb-2">
          La FEVES s&apos;efforce d&apos;assurer au mieux l&apos;exactitude et la mise à jour des informations diffusées sur la plateforme.
          Toutefois, elle ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations mises à disposition,
          notamment les informations professionnelles renseignées par les prestataires référencés.
        </p>
        <p className="mb-2">La FEVES ne saurait être tenue responsable :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Des interruptions du service et des éventuelles pannes ou dysfonctionnements, y compris ceux imputables à ses hébergeurs techniques ;</li>
          <li>De l&apos;exactitude des informations professionnelles renseignées par les utilisateurs de la plateforme ;</li>
          <li>Des liens hypertextes pointant vers d&apos;autres sites dont elle ne maîtrise pas le contenu.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">5. Données personnelles &amp; Cookies (RGPD)</h2>
        <p className="mb-2">
          La collecte, le traitement et la conservation des données personnelles sont effectués conformément au
          Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés. Pour le détail,
          consultez la{" "}
          <Link href="/legal/politique-confidentialite" className="underline hover:text-gray-600">
            Politique de confidentialité
          </Link>{" "}
          de la plateforme ResaPresta.
        </p>
        <p className="mb-2">
          Pour exercer vos droits (accès, rectification, effacement, opposition, limitation), contactez :{" "}
          <a href="mailto:pole-it@fevesguadeloupeetsaint.org" className="underline hover:text-gray-600">
            pole-it@fevesguadeloupeetsaint.org
          </a>
        </p>
        <p className="mb-2">
          Vous pouvez également introduire une réclamation auprès de la CNIL :{" "}
          <span className="font-medium">www.cnil.fr</span>
        </p>
        <p>
          La plateforme utilise des cookies techniques nécessaires à son fonctionnement et à la sécurisation des connexions.
          Aucun cookie de suivi ou publicitaire n&apos;est utilisé sans consentement préalable.
        </p>
      </section>

      <p className="text-xs text-gray-400 mt-12">Dernière mise à jour : juin 2026.</p>
    </div>
  );
}
