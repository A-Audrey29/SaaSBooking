export default function ConfidentialitePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-sm text-ink-700 space-y-8">
      <h1 className="text-2xl font-bold">Politique de confidentialité — ResaPresta</h1>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">1. Responsable du traitement</h2>
        <p>Le responsable du traitement des données est :</p>
        <address className="not-italic">
          <strong>FEVES</strong> — Fédération des espaces et des centres sociaux de Guadeloupe et Saint-Martin<br />
          28 rue Léon Blum, 97111 Morne-à-l&apos;Eau<br />
          <a href="mailto:cap-cd@fevesguadeloupeetsaint.org" className="underline hover:text-ink-900">
            cap-cd@fevesguadeloupeetsaint.org
          </a>
        </address>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">2. Données collectées</h2>
        <p>Dans le cadre de l&apos;utilisation de la plateforme ResaPresta, les données suivantes sont collectées, selon le type de compte :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Comptes référents (centres sociaux)</strong> : nom, prénom, email, mot de passe (haché), centre social affilié, rôle.</li>
          <li><strong>Comptes prestataires</strong> : nom, prénom, email, mot de passe (haché), téléphone, zone d&apos;intervention, rôles et spécialités professionnelles, documents administratifs justificatifs (diplôme, attestation URSSAF). Aucune coordonnée bancaire (RIB) n&apos;est collectée ni stockée sur la plateforme.</li>
          <li><strong>Comptes administrateurs FEVES</strong> : nom, prénom, email, rôle.</li>
          <li><strong>Données de planification</strong> : disponibilités déclarées par les prestataires, sessions et créneaux d&apos;ateliers, statut des missions (en attente, confirmée, refusée, terminée).</li>
          <li><strong>Journal d&apos;audit technique</strong> : action effectuée, auteur, horodatage — à des fins de sécurité et de traçabilité.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">3. Finalités du traitement</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Gérer les comptes utilisateurs et les accès à la plateforme ;</li>
          <li>Mettre en relation les référents des centres sociaux et les prestataires pour la réalisation des ateliers ;</li>
          <li>Planifier et suivre les sessions et créneaux d&apos;ateliers ;</li>
          <li>Assurer la sécurité et la traçabilité des actions réalisées sur la plateforme.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">4. Base légale du traitement</h2>
        <p>Le traitement de vos données repose, selon les cas, sur :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>L&apos;exécution du contrat</strong> liant FEVES à l&apos;utilisateur (référent, prestataire ou administrateur), dès lors que le traitement est nécessaire au fonctionnement du service auquel l&apos;utilisateur s&apos;inscrit ;</li>
          <li><strong>L&apos;intérêt légitime</strong> de FEVES pour la sécurité et la traçabilité des actions (journal d&apos;audit) ;</li>
          <li><strong>Une obligation légale ou une mission d&apos;intérêt général</strong>, le cas échéant, dans le cadre du programme financé sous lequel FEVES opère.</li>
        </ul>
        <p>
          La communication des informations professionnelles d&apos;un prestataire aux référents des centres
          sociaux constitue une condition d&apos;exécution du service de mise en relation auquel le prestataire
          adhère en se référençant. Le prestataire conserve toutefois un droit d&apos;opposition et de retrait
          de son référencement (cf. section 8).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">5. Destinataires des données</h2>
        <p>Les données sont accessibles uniquement aux personnes habilitées, dans la limite de leurs attributions :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Aux personnels habilités de la FEVES ;</li>
          <li>Aux référents des centres sociaux concernés, pour les informations professionnelles des prestataires nécessaires à la mise en relation ;</li>
          <li>Aux sous-traitants techniques suivants, agissant sur instruction de FEVES :
            <ul className="list-none pl-4 pt-2 space-y-1 text-xs text-ink-500">
              <li><strong>Render Services, Inc.</strong> — Hébergement de l&apos;application — San Francisco, États-Unis</li>
              <li><strong>Neon, LLC (A Databricks Company)</strong> — Hébergement de la base de données — San Francisco, États-Unis</li>
              <li><strong>Plus Five Five, Inc. (Resend)</strong> — Envoi des emails transactionnels — San Francisco, États-Unis (certifié EU-US Data Privacy Framework)</li>
            </ul>
          </li>
        </ul>
        <p>Les données ne sont ni vendues, ni cédées à des fins commerciales à des tiers.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">6. Durée de conservation</h2>
        <p>
          Les données des comptes actifs sont conservées pendant toute la durée de la relation
          contractuelle ou du référencement, puis pendant une durée de <strong>3 ans</strong> après la fin de cette
          relation, à des fins de preuve et de suivi administratif. Les données du journal d&apos;audit technique
          sont conservées pendant <strong>1 an</strong>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">7. Sécurité des données</h2>
        <p>
          La FEVES met en œuvre les mesures techniques et organisationnelles appropriées afin de
          garantir la sécurité, la confidentialité et l&apos;intégrité des données personnelles traitées sur la
          plateforme, notamment le chiffrement des mots de passe et la limitation des accès en fonction
          du rôle de chaque utilisateur.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">8. Vos droits</h2>
        <p>Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Droit d&apos;accès</li>
          <li>Droit de rectification</li>
          <li>Droit d&apos;effacement</li>
          <li>Droit d&apos;opposition</li>
          <li>Droit à la limitation</li>
          <li>Droit au retrait du consentement, lorsqu&apos;il constitue la base légale du traitement</li>
        </ul>
        <p>
          Pour les prestataires référencés, le droit d&apos;opposition s&apos;exerce également comme un{" "}
          <strong>droit de retrait du référencement</strong> : son exercice entraîne la cessation de la diffusion
          des informations professionnelles concernées auprès des centres sociaux, sans effet rétroactif
          sur les missions déjà engagées.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">9. Exercice de vos droits</h2>
        <p>Vous pouvez exercer vos droits à tout moment en nous contactant :</p>
        <address className="not-italic space-y-1">
          <p>Par e-mail : <a href="mailto:cap-cd@fevesguadeloupeetsaint.org" className="underline hover:text-ink-900">cap-cd@fevesguadeloupeetsaint.org</a></p>
          <p>Par courrier postal : 28 rue Léon Blum, 97111 Morne-à-l&apos;Eau</p>
        </address>
        <p>
          En cas de difficulté, vous avez également le droit d&apos;introduire une réclamation auprès de la
          CNIL :{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-900">
            www.cnil.fr
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">10. Cookies</h2>
        <p>
          La plateforme utilise des cookies techniques nécessaires à son fonctionnement et à la
          sécurisation des connexions. Aucun cookie de suivi ou publicitaire n&apos;est utilisé sans
          consentement préalable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">11. Mise à jour de la politique</h2>
        <p>
          La FEVES peut être amenée à modifier la présente politique afin de se conformer aux évolutions
          législatives, réglementaires ou techniques.
        </p>
      </section>

      <p className="text-xs text-ink-400 pt-4 border-t border-ink-150">Dernière mise à jour : juin 2026.</p>
    </div>
  );
}
