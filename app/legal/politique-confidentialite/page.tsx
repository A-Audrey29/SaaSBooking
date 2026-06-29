import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — ResaPresta",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-sm text-gray-800">
      <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 mb-8 inline-block">
        ← Retour
      </Link>

      <h1 className="text-2xl font-bold mb-8">Politique de confidentialité — ResaPresta</h1>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">1. Responsable du traitement</h2>
        <p className="mb-1 font-medium">FEVES — Fédération des espaces et des centres sociaux de Guadeloupe et Saint-Martin</p>
        <p>28 rue Léon Blum, 97111 Morne-à-l&apos;Eau</p>
        <p><a href="mailto:cap-cd@fevesguadeloupeetsaint.org" className="underline hover:text-gray-600">cap-cd@fevesguadeloupeetsaint.org</a></p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">2. Données collectées</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Comptes référents (centres sociaux) :</strong> nom, prénom, email, mot de passe (haché), centre social affilié, rôle.</li>
          <li><strong>Comptes prestataires :</strong> nom, prénom, email, mot de passe (haché), téléphone, zone d&apos;intervention, rôles et spécialités professionnelles, documents administratifs justificatifs (diplôme, attestation URSSAF). Aucune coordonnée bancaire (RIB) n&apos;est collectée ni stockée sur la plateforme.</li>
          <li><strong>Comptes administrateurs FEVES :</strong> nom, prénom, email, rôle.</li>
          <li><strong>Données de planification :</strong> disponibilités déclarées par les prestataires, sessions et créneaux d&apos;ateliers, statut des missions (en attente, confirmée, refusée, terminée).</li>
          <li><strong>Journal d&apos;audit technique :</strong> action effectuée, auteur, horodatage — à des fins de sécurité et de traçabilité.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">3. Finalités du traitement</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Gérer les comptes utilisateurs et les accès à la plateforme ;</li>
          <li>Mettre en relation les référents des centres sociaux et les prestataires pour la réalisation des ateliers ;</li>
          <li>Planifier et suivre les sessions et créneaux d&apos;ateliers ;</li>
          <li>Assurer la sécurité et la traçabilité des actions réalisées sur la plateforme.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">4. Base légale du traitement</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>L&apos;exécution du contrat</strong> liant FEVES à l&apos;utilisateur, dès lors que le traitement est nécessaire au fonctionnement du service (mise en relation, planification) ;</li>
          <li><strong>L&apos;intérêt légitime</strong> de FEVES pour la sécurité et la traçabilité des actions (journal d&apos;audit) ;</li>
          <li><strong>Une obligation légale ou une mission d&apos;intérêt général</strong>, le cas échéant, dans le cadre du programme financé sous lequel FEVES opère.</li>
        </ul>
        <p className="mt-3 text-gray-600 italic">
          La communication des informations professionnelles d&apos;un prestataire aux référents des centres sociaux n&apos;est pas soumise
          à un consentement librement révocable : elle constitue une condition d&apos;exécution du service de mise en relation.
          Le prestataire conserve toutefois un droit d&apos;opposition et de retrait de son référencement.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">5. Destinataires des données</h2>
        <p className="mb-3">Les données sont accessibles uniquement aux personnes habilitées :</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Aux personnels habilités de la FEVES ;</li>
          <li>Aux référents des centres sociaux concernés, pour les informations professionnelles des prestataires nécessaires à la mise en relation ;</li>
          <li>Aux sous-traitants techniques suivants, agissant sur instruction de FEVES.</li>
        </ul>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-medium">Sous-traitant</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium">Rôle</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium">Localisation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-3 py-2">Render Services, Inc.</td>
                <td className="border border-gray-200 px-3 py-2">Hébergement de l&apos;application</td>
                <td className="border border-gray-200 px-3 py-2">San Francisco, États-Unis</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-3 py-2">Neon, LLC (A Databricks Company)</td>
                <td className="border border-gray-200 px-3 py-2">Hébergement de la base de données</td>
                <td className="border border-gray-200 px-3 py-2">San Francisco, États-Unis</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2">Plus Five Five, Inc. (Resend)</td>
                <td className="border border-gray-200 px-3 py-2">Envoi des emails transactionnels</td>
                <td className="border border-gray-200 px-3 py-2">San Francisco, États-Unis</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">Les données ne sont ni vendues, ni cédées à des fins commerciales à des tiers.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">6. Durée de conservation</h2>
        <p className="mb-2">
          Les données des comptes actifs sont conservées pendant toute la durée de la relation contractuelle ou du référencement,
          puis pendant <strong>3 ans</strong> après la fin de cette relation. Les données du journal d&apos;audit technique sont conservées pendant <strong>1 an</strong>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">7. Sécurité des données</h2>
        <p>
          La FEVES met en œuvre les mesures techniques et organisationnelles appropriées afin de garantir la sécurité,
          la confidentialité et l&apos;intégrité des données personnelles traitées sur la plateforme, notamment le chiffrement
          des mots de passe et la limitation des accès en fonction du rôle de chaque utilisateur.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">8. Vos droits</h2>
        <p className="mb-2">Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :</p>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Droit d&apos;accès</li>
          <li>Droit de rectification</li>
          <li>Droit d&apos;effacement</li>
          <li>Droit d&apos;opposition</li>
          <li>Droit à la limitation</li>
          <li>Droit au retrait du consentement, lorsqu&apos;il constitue la base légale du traitement</li>
        </ul>
        <p className="text-gray-600 italic">
          Pour les prestataires référencés, le droit d&apos;opposition s&apos;exerce également comme un droit de retrait du référencement,
          sans effet rétroactif sur les missions déjà engagées.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">9. Exercice de vos droits</h2>
        <p className="mb-1">Par e-mail : <a href="mailto:pole-it@fevesguadeloupeetsaint.org" className="underline hover:text-gray-600">pole-it@fevesguadeloupeetsaint.org</a></p>
        <p className="mb-1">Par courrier postal : 28 rue Léon Blum, 97111 Morne-à-l&apos;Eau</p>
        <p>En cas de difficulté, vous pouvez introduire une réclamation auprès de la CNIL : <span className="font-medium">www.cnil.fr</span></p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">10. Cookies</h2>
        <p>
          La plateforme utilise des cookies techniques nécessaires à son fonctionnement et à la sécurisation des connexions.
          Aucun cookie de suivi ou publicitaire n&apos;est utilisé sans consentement préalable.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">11. Mise à jour de la politique</h2>
        <p>
          La FEVES peut être amenée à modifier la présente politique afin de se conformer aux évolutions législatives,
          réglementaires ou techniques.
        </p>
      </section>

      <p className="text-xs text-gray-400 mt-12">Dernière mise à jour : juin 2026.</p>
    </div>
  );
}
