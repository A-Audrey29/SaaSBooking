import { FaqSection } from "@/components/aide/faq-section";

export default function AideAdminPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
      <div>
        <h1 className="text-h-md font-bold text-ink-900">Centre d&apos;aide</h1>
        <p className="text-t-sm text-ink-500 mt-1">Espace administrateur — ResaPresta</p>
      </div>

      {/* ── Section Admin (mise en avant) ── */}
      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6 space-y-6">
        <p className="text-t-sm font-semibold text-primary uppercase tracking-wide">
          Espace administrateur
        </p>

        <FaqSection
          title="Gérer la plateforme"
          faqs={[
            {
              question: "Comment créer un centre social ?",
              answer:
                "Allez dans Centres puis cliquez sur « Nouveau centre ». Renseignez le nom et les informations du centre. Une fois créé, vous pourrez y inviter des référents.",
            },
            {
              question: "Comment inviter un référent sur un centre ?",
              answer:
                "Ouvrez la fiche d'un centre, section Équipe. Cliquez sur « Inviter un référent » et entrez son email. Il recevra un lien magic link pour activer son compte.",
            },
            {
              question: "Comment inviter un prestataire ?",
              answer:
                "Allez dans Prestataires et cliquez sur « Inviter un prestataire ». Entrez son email et son métier. Il recevra un email d'invitation avec un lien magic link.",
            },
            {
              question: "Comment créer un type d'atelier ?",
              answer:
                "Dans Ateliers, cliquez sur « Nouveau type d'atelier ». Donnez-lui un nom et ajoutez les postes prestataires nécessaires (ex. 1 animateur, 1 psychologue). Ce modèle sera réutilisable par les référents.",
            },
            {
              question: "Comment créer un métier ?",
              answer:
                "Allez dans Métiers et cliquez sur « Nouveau métier ». Les métiers sont ensuite disponibles pour définir les postes sur les types d'ateliers et les profils prestataires.",
            },
            {
              question: "Comment gérer les utilisateurs ?",
              answer:
                "Dans Utilisateurs, vous voyez l'ensemble des comptes actifs. Vous pouvez y consulter les rôles, désactiver un compte ou réinitialiser un accès.",
            },
            {
              question: "À quoi sert l'export comptable ?",
              answer:
                "L'export compta génère un fichier récapitulatif des missions confirmées sur une période donnée : prestataire, centre, séance, dates. Utile pour le suivi financier.",
            },
          ]}
        />
      </div>

      {/* ── Section Référent ── */}
      <div className="space-y-2">
        <p className="text-t-sm font-semibold text-ink-500 uppercase tracking-wide">
          Espace référent
        </p>

        <FaqSection
          title="Premiers pas"
          faqs={[
            {
              question: "C'est quoi ResaPresta ?",
              answer:
                "ResaPresta coordonne les centres sociaux et les prestataires pour organiser des ateliers multi-séances. En tant que référent, vous créez les séances, définissez les besoins en prestataires et suivez les confirmations.",
            },
          ]}
        />

        <FaqSection
          title="Créer une séance"
          faqs={[
            {
              question: "Comment créer une nouvelle séance ?",
              answer: (
                <>
                  Depuis votre tableau de bord, cliquez sur <strong>Nouvelle séance</strong>.
                  Choisissez un atelier existant ou créez-en un nouveau via le bouton rapide.
                  Définissez la date, l&apos;heure et les prestataires nécessaires, puis validez.
                </>
              ),
            },
          ]}
        />

        <FaqSection
          title="Comprendre les statuts"
          faqs={[
            {
              question: "Quels sont les statuts d'une séance ?",
              answer: (
                <ul className="space-y-1.5 list-none">
                  <li><span className="font-medium text-amber-700">Planifiée</span> — séance créée, au moins un prestataire en attente ou non pourvu.</li>
                  <li><span className="font-medium text-green-700">Confirmée</span> — tous les prestataires ont accepté.</li>
                  <li><span className="font-medium text-blue-700">Terminée</span> — séance passée.</li>
                  <li><span className="font-medium text-red-700">Annulée</span> — séance annulée, toutes les demandes prestataires sont annulées en cascade.</li>
                </ul>
              ),
            },
            {
              question: "Quelle différence entre « ignoré » et « annulé » sur un besoin prestataire ?",
              answer: (
                <>
                  <p><strong>Ignoré</strong> : vous avez décidé de ne pas chercher de prestataire pour ce besoin. La séance a lieu normalement sans cette personne.</p>
                  <p className="mt-1"><strong>Annulé</strong> : la séance entière a été annulée. Tous les besoins prestataires passent automatiquement en « annulé ».</p>
                </>
              ),
            },
            {
              question: "Que signifie « bloqué » sur une séance ?",
              answer:
                "« Bloqué » s'affiche quand au moins un prestataire a refusé ET qu'un autre poste est encore vide. La séance ne peut pas être confirmée sans que vous agissiez : réassigner le refus ou ignorer le besoin.",
            },
          ]}
        />

        <FaqSection
          title="Gérer les prestataires"
          faqs={[
            {
              question: "Comment inviter un prestataire sur une séance ?",
              answer:
                "Sur la fiche séance, cliquez sur un poste vide et sélectionnez un prestataire dans la liste. L'invitation est envoyée par email automatiquement. Le poste passe en « en attente ».",
            },
            {
              question: "Un prestataire a refusé — que faire ?",
              answer:
                "Depuis la fiche séance, le poste apparaît en rouge. Vous pouvez inviter un autre prestataire à la place, ou ignorer ce besoin si la séance peut avoir lieu sans.",
            },
          ]}
        />
      </div>

      {/* ── Section Prestataire ── */}
      <div className="space-y-2">
        <p className="text-t-sm font-semibold text-ink-500 uppercase tracking-wide">
          Espace prestataire
        </p>

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

        <FaqSection
          title="Mes missions"
          faqs={[
            {
              question: "Comment accepter ou refuser une mission ?",
              answer:
                "Ouvrez la demande dans votre espace et cliquez sur « Accepter » ou « Refuser ». Le référent est notifié automatiquement.",
            },
            {
              question: "Que signifient les statuts sur les missions ?",
              answer: (
                <ul className="space-y-1.5 list-none">
                  <li><span className="font-medium text-amber-700">En attente</span> — invitation envoyée, réponse attendue.</li>
                  <li><span className="font-medium text-green-700">Confirmée</span> — mission acceptée et planifiée.</li>
                  <li><span className="font-medium text-red-700">Refusée</span> — le prestataire a refusé.</li>
                  <li><span className="font-medium text-gray-600">Annulée</span> — le référent a annulé la demande ou la séance.</li>
                  <li><span className="font-medium text-blue-700">Terminée</span> — la séance a eu lieu.</li>
                </ul>
              ),
            },
          ]}
        />

        <FaqSection
          title="Disponibilités"
          faqs={[
            {
              question: "À quoi servent les disponibilités ?",
              answer:
                "Les créneaux de disponibilité aident les référents à identifier les prestataires disponibles avant d'envoyer une demande.",
            },
            {
              question: "Comment bloquer un créneau (exception) ?",
              answer:
                "Dans le calendrier des disponibilités, cliquez sur un créneau marqué « disponible » et choisissez « Indisponible ». Cela crée une exception sans affecter les autres créneaux.",
            },
          ]}
        />
      </div>

      <p className="text-t-xs text-ink-400 pb-4">
        Besoin d&apos;aide supplémentaire ? Contactez l&apos;équipe ResaPresta.
      </p>
    </div>
  );
}
