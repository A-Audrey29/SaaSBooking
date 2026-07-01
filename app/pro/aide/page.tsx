import { FaqSection } from "@/components/aide/faq-section";

// Vidéo : dépose le fichier dans public/videos/provider/ puis ajoute video={{ src, title }} sur la question voulue.

export default function AideProviderPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
      <div>
        <h1 className="text-h-md font-bold text-ink-900">Centre d&apos;aide</h1>
        <p className="text-t-sm text-ink-500 mt-1">Espace prestataire — ResaPresta</p>
      </div>

      {/* ── Premiers pas ── */}
      <FaqSection
        title="Premiers pas"
        faqs={[
          {
            question: "C'est quoi ResaPresta ?",
            answer:
              "ResaPresta coordonne les centres sociaux et les prestataires pour organiser des ateliers. En tant que prestataire, vous recevez des demandes de mission par email, et vous pouvez les accepter ou les refuser depuis votre espace.",
          },
        ]}
      />

      {/* ── Missions ── */}
      <FaqSection
        title="Mes missions"
        faqs={[
          {
            question: "Comment voir mes demandes de mission ?",
            answer: (
              <>
                Depuis votre espace, cliquez sur <strong>Demandes</strong> dans le menu.
                Vous voyez toutes les demandes en attente de réponse, ainsi que l&apos;historique
                de vos missions passées.
              </>
            ),
          },
          {
            question: "Comment accepter une mission ?",
            answer:
              "Ouvrez la demande et cliquez sur « Accepter ». Le référent est notifié automatiquement et la mission passe en « confirmée ».",
          },
          {
            question: "Comment refuser une mission ?",
            answer:
              "Ouvrez la demande et cliquez sur « Refuser ». Le référent est notifié pour qu'il puisse trouver un autre prestataire. Pensez à refuser rapidement pour ne pas bloquer l'organisation de la séance.",
          },
          {
            question: "Puis-je annuler une mission que j'ai acceptée ?",
            answer:
              "Non, pas directement depuis l'application. Contactez le référent du centre social concerné pour qu'il puisse annuler ou réassigner la mission.",
          },
          {
            question: "Que signifient les statuts sur mes missions ?",
            answer: (
              <ul className="space-y-1.5 list-none">
                <li><span className="font-medium text-amber-700">En attente</span> — le référent vous a envoyé une invitation, votre réponse est attendue.</li>
                <li><span className="font-medium text-green-700">Confirmée</span> — vous avez accepté, la mission est planifiée.</li>
                <li><span className="font-medium text-red-700">Refusée</span> — vous avez refusé cette demande.</li>
                <li><span className="font-medium text-gray-600">Annulée</span> — le référent a annulé la demande ou la séance entière.</li>
                <li><span className="font-medium text-blue-700">Terminée</span> — la séance a eu lieu.</li>
              </ul>
            ),
          },
          {
            question: "J'ai reçu une demande déjà annulée, pourquoi ?",
            answer:
              "Cela arrive si le référent a annulé la demande après vous l'avoir envoyée. La mission apparaît dans votre historique avec le statut « annulée » pour garder une trace.",
          },
        ]}
      />

      {/* ── Disponibilités ── */}
      <FaqSection
        title="Mes disponibilités"
        faqs={[
          {
            question: "À quoi servent mes disponibilités ?",
            answer:
              "Vos créneaux de disponibilité aident les référents à identifier les prestataires disponibles au bon moment avant d'envoyer une demande. Renseignez-les pour être sollicité sur des séances qui correspondent à votre agenda.",
          },
          {
            question: "Comment ajouter des disponibilités récurrentes ?",
            answer: (
              <>
                Allez dans <strong>Mes dispos</strong> et cliquez sur un créneau dans le calendrier.
                Choisissez « Disponible » et indiquez si c&apos;est une occurrence ponctuelle ou récurrente
                (ex. tous les mardis matin).
              </>
            ),
          },
          {
            question: "Comment bloquer un créneau (exception) ?",
            answer:
              "Dans le calendrier des disponibilités, cliquez sur un créneau marqué « disponible » et choisissez « Indisponible ». Cela crée une exception qui annule la disponibilité pour ce créneau précis, sans affecter les autres.",
          },
          {
            question: "Si j'ai une mission confirmée, mon créneau peut-il être bloqué par une exception ?",
            answer:
              "Non. Un créneau sur lequel vous avez une mission confirmée est protégé — une exception d'indisponibilité ne peut pas le supprimer.",
          },
        ]}
      />

      {/* ── Compte ── */}
      <FaqSection
        title="Mon compte"
        faqs={[
          {
            question: "Comment modifier mon profil ?",
            answer: (
              <>
                Cliquez sur <strong>Profil</strong> dans le menu. Vous pouvez y mettre à jour
                vos informations (nom, email, métier, biographie).
              </>
            ),
          },
          {
            question: "Mes informations sont visibles par qui ?",
            answer:
              "Votre nom et votre métier sont visibles par les référents des centres sociaux partenaires. Votre email n'est jamais affiché publiquement.",
          },
        ]}
      />

      <p className="text-t-xs text-ink-400 pb-4">
        Besoin d&apos;aide supplémentaire ? Contactez le référent du centre social concerné.
      </p>
    </div>
  );
}
