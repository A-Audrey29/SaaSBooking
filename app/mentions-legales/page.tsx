export default function MentionsLegalesPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-sm text-ink-700 space-y-8">
      <h1 className="text-2xl font-bold">Mentions légales — ResaPresta</h1>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">1. Identification de l&apos;éditeur du site</h2>
        <dl className="space-y-1">
          <div><dt className="inline font-medium">Statut : </dt><dd className="inline">Association</dd></div>
          <div><dt className="inline font-medium">Dénomination sociale : </dt><dd className="inline">Fédération des espaces et des centres sociaux de Guadeloupe et Saint-Martin (FEVES)</dd></div>
          <div><dt className="inline font-medium">Forme juridique : </dt><dd className="inline">Association loi 1901</dd></div>
          <div><dt className="inline font-medium">Adresse du siège social : </dt><dd className="inline">28 rue Léon Blum, 97111 Morne-à-l&apos;Eau</dd></div>
          <div><dt className="inline font-medium">Contact : </dt><dd className="inline"><a href="mailto:cap-cd@fevesguadeloupeetsaint.org" className="underline hover:text-ink-900">cap-cd@fevesguadeloupeetsaint.org</a></dd></div>
          <div><dt className="inline font-medium">Directrice de la publication : </dt><dd className="inline">Françoise GACE (Présidente)</dd></div>
          <div><dt className="inline font-medium">Numéro SIRET : </dt><dd className="inline">921 972 592 00023</dd></div>
          <div><dt className="inline font-medium">Numéro de TVA intracommunautaire : </dt><dd className="inline">Non applicable</dd></div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">2. Nom de domaine et hébergement</h2>
        <p>La plateforme ResaPresta est accessible à l&apos;adresse <strong>resapresta.fr</strong>.</p>

        <p><strong>Nom de domaine</strong> — Le nom de domaine resapresta.fr est enregistré auprès de :<br />
        o2switch — 222 Boulevard Gustave Flaubert, 63000 Clermont-Ferrand, France</p>

        <p><strong>Hébergement applicatif</strong> — L&apos;application ResaPresta est hébergée par :<br />
        Render Services, Inc. — 525 Brannan Street, Ste 300, San Francisco, CA 94107, États-Unis</p>

        <p><strong>Hébergement de la base de données</strong> — La base de données de la plateforme est hébergée par :<br />
        Neon, LLC (A Databricks Company) — 160 Spear Street, 15th Floor, San Francisco, CA 94105, États-Unis</p>

        <p><strong>Envoi des emails transactionnels</strong> — Les emails transactionnels de la plateforme (notifications, invitations) sont envoyés via :<br />
        Plus Five Five, Inc. (Resend) — 2261 Market Street #5039, San Francisco, CA 94114, États-Unis</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">3. Propriété intellectuelle</h2>
        <p>
          Tous les contenus présents sur la plateforme ResaPresta (textes, documents, logos, éléments
          graphiques, etc.) sont protégés par le droit d&apos;auteur et, plus largement, par le droit de la
          propriété intellectuelle.
        </p>
        <p>
          Toute reproduction, distribution, modification, adaptation, retransmission ou publication, totale
          ou partielle, est interdite sans l&apos;accord écrit préalable de la FEVES.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">4. Responsabilité</h2>
        <p>
          La FEVES s&apos;efforce d&apos;assurer au mieux l&apos;exactitude et la mise à jour des informations diffusées
          sur la plateforme. Toutefois, elle ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des
          informations mises à disposition.
        </p>
        <p>La FEVES ne saurait être tenue responsable :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Des interruptions du service et des éventuelles pannes ou dysfonctionnements, y compris ceux imputables à ses hébergeurs techniques ;</li>
          <li>De l&apos;exactitude des informations professionnelles renseignées par les utilisateurs de la plateforme ;</li>
          <li>Des liens hypertextes pointant vers d&apos;autres sites dont elle ne maîtrise pas le contenu.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">5. Données personnelles &amp; Cookies (RGPD)</h2>
        <p>
          La collecte, le traitement et la conservation des données personnelles sont effectués
          conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
          Informatique et Libertés. Pour le détail, consultez la{" "}
          <a href="/confidentialite" className="underline hover:text-ink-900">Politique de confidentialité</a>{" "}
          de la plateforme ResaPresta.
        </p>
        <p>
          Pour exercer vos droits (accès, rectification, effacement, opposition, limitation), contactez :{" "}
          <a href="mailto:cap-cd@fevesguadeloupeetsaint.org" className="underline hover:text-ink-900">
            cap-cd@fevesguadeloupeetsaint.org
          </a>
        </p>
        <p>
          Vous pouvez également introduire une réclamation auprès de la CNIL :{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-900">
            www.cnil.fr
          </a>
        </p>
        <p>
          La plateforme utilise des cookies techniques nécessaires à son fonctionnement et à la
          sécurisation des connexions. Aucun cookie de suivi ou publicitaire n&apos;est utilisé sans
          consentement préalable.
        </p>
      </section>

      <p className="text-xs text-ink-400 pt-4 border-t border-ink-150">Dernière mise à jour : juin 2026.</p>
    </div>
  );
}
