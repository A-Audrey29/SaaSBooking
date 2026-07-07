import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — ResaPresta",
};

export default function CguPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-sm text-gray-800">
      <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 mb-8 inline-block">
        ← Retour
      </Link>

      <h1 className="text-2xl font-bold mb-8">Conditions générales d&apos;utilisation — ResaPresta</h1>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">1. Objet</h2>
        <p className="mb-2">
          Les présentes Conditions Générales d&apos;Utilisation (CGU) ont pour objet de définir les modalités et conditions
          dans lesquelles la Fédération des espaces et des centres sociaux de Guadeloupe et Saint-Martin (FEVES) met
          à disposition la plateforme ResaPresta, ainsi que les droits et obligations des utilisateurs dans ce cadre.
        </p>
        <p>
          ResaPresta est un service de coordination entre des centres sociaux et des prestataires (animateurs, éducateurs,
          psychologues et autres intervenants) en vue de l&apos;organisation d&apos;ateliers. La FEVES agit en tant qu&apos;éditeur et
          opérateur de la mise en relation ; elle n&apos;est pas partie aux missions exécutées entre un centre social et un prestataire.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">2. Définitions</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Plateforme :</strong> le service ResaPresta, accessible à l&apos;adresse resapresta.fr ;</li>
          <li><strong>Référent :</strong> utilisateur agissant pour le compte d&apos;un centre social, habilité à créer des sessions d&apos;ateliers et à solliciter des prestataires ;</li>
          <li><strong>Prestataire :</strong> intervenant professionnel référencé sur la Plateforme, habilité à répondre aux demandes de mise en relation ;</li>
          <li><strong>Administrateur :</strong> personnel habilité de la FEVES assurant la gestion du référencement et du catalogue ;</li>
          <li><strong>Atelier / Session / Créneau :</strong> les unités d&apos;organisation des interventions planifiées sur la Plateforme.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">3. Acceptation des CGU</h2>
        <p>
          L&apos;accès et l&apos;utilisation de la Plateforme impliquent l&apos;acceptation pleine et entière des présentes CGU.
          Tout utilisateur créant un compte reconnaît avoir pris connaissance des CGU et les accepter sans réserve.
          Les présentes CGU s&apos;adressent à des utilisateurs agissant dans le cadre de leur activité professionnelle ou
          de leurs fonctions au sein d&apos;une structure.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">4. Accès à la plateforme et création de compte</h2>
        <p className="mb-2">L&apos;accès est réservé aux utilisateurs disposant d&apos;un compte créé ou validé selon les modalités suivantes :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Les comptes <strong>Référent</strong> sont créés ou validés par un Administrateur, sur rattachement à un centre social identifié ;</li>
          <li>Les comptes <strong>Prestataire</strong> sont créés sur demande de référencement, soumise à validation par un Administrateur ;</li>
          <li>Les comptes <strong>Administrateur</strong> sont créés par la FEVES pour son propre personnel habilité.</li>
        </ul>
        <p className="mt-2">
          Chaque utilisateur est responsable de la confidentialité de ses identifiants de connexion et de toute activité
          réalisée depuis son compte. Toute suspicion d&apos;accès non autorisé doit être signalée sans délai à la FEVES.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">5. Obligations générales des utilisateurs</h2>
        <p className="mb-2">Chaque utilisateur s&apos;engage à :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Fournir des informations exactes, complètes et à jour lors de son inscription et tout au long de l&apos;utilisation de la Plateforme ;</li>
          <li>Utiliser la Plateforme conformément à sa destination, à l&apos;exclusion de tout usage frauduleux, abusif ou contraire à la réglementation applicable ;</li>
          <li>Ne pas porter atteinte au bon fonctionnement technique de la Plateforme ;</li>
          <li>Respecter les droits des autres utilisateurs, notamment leur vie privée et la confidentialité des échanges réalisés via la Plateforme.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">6. Obligations spécifiques des prestataires référencés</h2>

        <h3 className="font-medium mb-2 mt-4">6.1 — Confidentialité des informations relatives au projet</h3>
        <p className="mb-2">
          Dans le cadre de son référencement et de son intervention au sein du projet « Carnet d&apos;Accompagnement à la
          Parentalité – Mobilisation Familiale », le Prestataire reconnaît que les informations, documents, données, fichiers,
          échanges, méthodes, procédures, ainsi que toute autre information portée à sa connaissance par l&apos;intermédiaire de la
          plateforme ResaPresta ou de ses utilisateurs, revêtent un caractère strictement confidentiel.
        </p>
        <p className="mb-2">Le Prestataire s&apos;engage à :</p>
        <ul className="list-disc pl-5 space-y-1 mb-2">
          <li>Ne divulguer aucune information confidentielle à un tiers, sous quelque forme que ce soit ;</li>
          <li>N&apos;utiliser les informations confidentielles qu&apos;aux seules fins de l&apos;exécution des prestations pour lesquelles il est sollicité ;</li>
          <li>Mettre en œuvre toutes les mesures techniques, organisationnelles et de sécurité nécessaires afin de garantir la confidentialité, l&apos;intégrité et la protection des données auxquelles il a accès ;</li>
          <li>Limiter l&apos;accès à ces informations à ses seuls collaborateurs, salariés ou sous-traitants directement concernés par l&apos;exécution de la prestation et soumis à une obligation de confidentialité équivalente ;</li>
          <li>Respecter l&apos;ensemble des dispositions applicables en matière de protection des données personnelles, notamment le Règlement (UE) 2016/679 du 27 avril 2016 (RGPD) et toute réglementation nationale applicable.</li>
        </ul>
        <p className="mb-2">
          Le Prestataire s&apos;interdit notamment de copier, reproduire, transmettre, exploiter, diffuser ou conserver des
          données au-delà de ce qui est strictement nécessaire à l&apos;exécution de sa mission.
        </p>
        <p className="text-gray-600 italic">
          Cette obligation de confidentialité demeure en vigueur pendant toute la durée du référencement sur la plateforme
          ResaPresta et pendant une période de cinq (5) ans suivant la fin de la relation contractuelle, quelle qu&apos;en soit la cause.
          Toute violation pourra entraîner la suspension ou la suppression immédiate du référencement du Prestataire, sans
          préjudice de toute action en réparation des préjudices subis par la FEVES ou les personnes concernées.
        </p>

        <h3 className="font-medium mb-2 mt-4">6.2 — Autorisation de communication des informations professionnelles</h3>
        <p className="mb-2">
          Le Prestataire autorise expressément la FEVES, en tant qu&apos;entité exploitant la plateforme ResaPresta, à collecter,
          enregistrer, traiter, exploiter et communiquer aux clients, prospects, partenaires institutionnels ou financeurs de
          projets les informations professionnelles qu&apos;il renseigne sur la plateforme. Cette autorisation porte notamment sur :
        </p>
        <ul className="list-disc pl-5 space-y-1 mb-2">
          <li>son identité professionnelle ;</li>
          <li>sa raison sociale ou son nom commercial ;</li>
          <li>ses coordonnées professionnelles ;</li>
          <li>son numéro SIREN/SIRET ;</li>
          <li>ses domaines d&apos;intervention et compétences ;</li>
          <li>ses certifications, habilitations et qualifications ;</li>
          <li>ses références professionnelles ;</li>
          <li>ses disponibilités ;</li>
          <li>toute information nécessaire à son référencement et à sa mise en relation avec des clients ou prospects.</li>
        </ul>
        <p className="mb-2">
          Le Prestataire autorise la FEVES à présenter, diffuser et transmettre ces informations par tout moyen, notamment via
          sa plateforme numérique, ses supports commerciaux, ses propositions d&apos;intervention, ses réponses à appels à projets,
          ses actions de prospection commerciale et ses opérations de mise en relation.
        </p>
        <p className="mb-2">
          Le Prestataire reconnaît que cette diffusion constitue une condition essentielle de son référencement sur la
          plateforme ResaPresta et qu&apos;elle a pour unique finalité la promotion de ses services et la facilitation de relations
          d&apos;affaires. Le Prestataire garantit l&apos;exactitude des informations communiquées et s&apos;engage à les maintenir à jour ;
          il demeure responsable des informations qu&apos;il fournit à la FEVES.
        </p>
        <p>
          Cette autorisation est consentie pour toute la durée du référencement du Prestataire sur la plateforme et pourra être
          révoquée par demande écrite, sous réserve des obligations légales de conservation et des engagements déjà contractés
          avec des clients ou prospects avant la date de la demande.
        </p>

        <h3 className="font-medium mb-2 mt-4">6.3 — Absence de cession de clientèle</h3>
        <p>
          Le référencement du Prestataire sur ResaPresta et la communication de ses informations professionnelles ne confèrent
          aucun droit de propriété sur la clientèle, les prospects ou les données de la plateforme. Le Prestataire s&apos;interdit
          d&apos;utiliser les informations obtenues par l&apos;intermédiaire de ResaPresta à des fins de prospection directe en dehors des
          missions pour lesquelles il a été mis en relation, sauf accord écrit préalable de la FEVES.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">7. Obligations spécifiques des référents</h2>
        <p>
          Le Référent s&apos;engage à utiliser les informations professionnelles des prestataires aux seules fins de l&apos;organisation
          des ateliers relevant de son centre social, et à ne pas les communiquer à des tiers étrangers à cette finalité.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">8. Responsabilités et garanties</h2>
        <p className="mb-2">
          La FEVES assure la mise à disposition de la Plateforme en tant qu&apos;outil de coordination. Elle n&apos;est pas partie
          au contrat ou à la mission éventuellement conclue entre un centre social et un prestataire à l&apos;issue d&apos;une mise
          en relation, et ne saurait être tenue responsable de l&apos;exécution, de la qualité ou des conséquences de cette mission.
        </p>
        <p>
          La FEVES ne garantit pas l&apos;exactitude des informations renseignées par les utilisateurs et ne saurait être tenue
          responsable des interruptions de service, notamment celles imputables à ses prestataires d&apos;hébergement technique.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">9. Propriété intellectuelle</h2>
        <p>
          Les contenus de la Plateforme (textes, structure, logos, éléments graphiques) sont protégés par le droit de la
          propriété intellectuelle et restent la propriété de la FEVES. Toute reproduction ou exploitation non autorisée est interdite.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">10. Protection des données personnelles</h2>
        <p>
          Le traitement des données personnelles est décrit dans la{" "}
          <Link href="/legal/politique-confidentialite" className="underline hover:text-gray-600">
            Politique de confidentialité
          </Link>{" "}
          de ResaPresta, qui fait partie intégrante des présentes CGU.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">11. Durée, suspension et résiliation du référencement</h2>
        <p>
          Le référencement est conclu pour la durée de la relation entre l&apos;utilisateur et la FEVES. La FEVES peut suspendre
          ou supprimer un compte en cas de manquement aux présentes CGU, notamment en cas de violation de l&apos;obligation de
          confidentialité, sans préjudice de toute action en réparation.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">12. Modification des CGU</h2>
        <p>
          La FEVES peut modifier les présentes CGU à tout moment, notamment pour se conformer aux évolutions législatives,
          réglementaires ou techniques. Les utilisateurs seront informés de toute modification substantielle.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">13. Droit applicable et juridiction compétente</h2>
        <p>
          Les présentes CGU sont soumises au droit français. À défaut de résolution amiable, tout litige relève de la
          compétence des tribunaux du ressort de la Cour d&apos;appel de Basse-Terre.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">14. Contact</h2>
        <p>
          Pour toute question relative aux présentes CGU :{" "}
          <a href="mailto:cap-cd@fevesguadeloupeetsaint.org" className="underline hover:text-gray-600">
            cap-cd@fevesguadeloupeetsaint.org
          </a>
        </p>
      </section>

      <p className="text-xs text-gray-400 mt-12">Dernière mise à jour : juillet 2026.</p>
    </div>
  );
}
