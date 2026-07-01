import { FaqSection } from "@/components/aide/faq-section";

// Vidéo : dépose le fichier dans public/videos/referent/ puis mets à jour src ci-dessous.

export default function AideReferentPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
      <div>
        <h1 className="text-h-md font-bold text-ink-900">Centre d'aide</h1>
        <p className="text-t-sm text-ink-500 mt-1">Espace référent — ResaPresta</p>
      </div>

      {/* ── Premiers pas ── */}
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

      {/* ── Créer une séance ── */}
      <FaqSection
        title="Créer une séance"
        faqs={[
          {
            question: "Comment créer une nouvelle séance ?",
            video: {
              title: "Créer un atelier",
              src: "/videos/referent/creer-atelier.mp4",
              description: "De la création de l'atelier jusqu'à la première séance",
            },
            answer: (
              <>
                Depuis votre tableau de bord, cliquez sur <strong>Nouvelle séance</strong>.
                Choisissez un atelier existant ou créez-en un nouveau via le bouton rapide.
                Définissez la date, l'heure et les prestataires nécessaires, puis validez.
              </>
            ),
          },
        ]}
      />

      {/* ── Comprendre les statuts ── */}
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
          {
            question: "Comment annuler une séance ?",
            answer:
              "Ouvrez la séance concernée et utilisez le bouton « Annuler la séance ». Toutes les demandes prestataires en cours sont annulées automatiquement.",
          },
        ]}
      />

      {/* ── Gérer les prestataires ── */}
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
          {
            question: "Je veux annuler une invitation déjà envoyée.",
            answer:
              "Cliquez sur le poste en « en attente » et choisissez « Annuler l'invitation ». Le poste repasse à vide. Le prestataire verra la demande comme annulée dans son espace.",
          },
          {
            question: "Comment voir les disponibilités d'un prestataire ?",
            answer:
              "Dans la section Prestataires, ouvrez la fiche du prestataire. Ses créneaux disponibles sont affichés dans son calendrier.",
          },
        ]}
      />

      {/* ── Mon compte ── */}
      <FaqSection
        title="Mon compte"
        faqs={[
          {
            question: "Comment modifier mes informations personnelles ?",
            answer: (
              <>
                Cliquez sur votre nom en bas à gauche de la barre latérale, puis sur{" "}
                <strong>Mon compte</strong>. Vous pouvez y modifier votre nom et votre email.
              </>
            ),
          },
        ]}
      />

      {/* ── Questions pour admins uniquement ── */}
      <FaqSection
        title="Pour aller plus loin (administrateurs)"
        faqs={[
          {
            question: "Qu'est-ce qu'un type d'atelier ?",
            answer:
              "Un type d'atelier est un modèle réutilisable (ex. « Parentalité », « Sport santé »). Il définit les métiers de prestataires nécessaires pour chaque séance. Une fois créé, vous pouvez l'utiliser pour toutes vos séances du même atelier.",
          },
          {
            question: "C'est quoi un poste prestataire ?",
            answer:
              "Un poste représente un besoin précis sur une séance : 1 poste = 1 personne d'un métier donné. Si vous avez besoin de 2 animateurs, vous créez 2 postes « Animateur ». Chaque poste sera attribué à un prestataire différent.",
          },
        ]}
      />

      <p className="text-t-xs text-ink-400 pb-4">
        Besoin d'aide supplémentaire ? Contactez votre administrateur de centre.
      </p>
    </div>
  );
}
