import "server-only";

import { deliverEmail } from "@/server/lib/email";
import { INVITATION_VALIDITY_DAYS } from "@/server/constants/invitation";

interface SendInvitationEmailParams {
  to: string;
  name: string | null;
  inviterName: string;
  token: string;
}

interface SendInvitationEmailResult {
  sent: boolean;
  error?: string;
}

// inviterName is part of the public signature but not used in the text (pre-existing).
export async function sendInvitationEmail({
  to,
  name,
  token,
}: SendInvitationEmailParams): Promise<SendInvitationEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const setupUrl = `${appUrl}/setup-password?token=${token}`;
  const { subject, text } = buildInvitationEmail({ to, name, setupUrl });

  return deliverEmail({ type: "invitation", to, subject, text, devLog: { setupUrl } });
}

/**
 * Subject + text of the invitation email. Single source for the real send
 * and the preview (preview passes PREVIEW_LINK_PLACEHOLDER as setupUrl).
 */
export function buildInvitationEmail({
  to,
  name,
  setupUrl,
}: {
  to: string;
  name: string | null;
  setupUrl: string;
}): { subject: string; text: string } {
  const displayName = name || to;

  const body = `Bonjour ${displayName},

L'équipe Cap de FEVES Guadeloupe vous a créé un compte sur ResaPresta, la plateforme de coordination des ateliers du projet Passerelle CAP.

─────────────────────────────────
COMMENT ACCÉDER À VOTRE COMPTE ?
─────────────────────────────────

1. Cliquez sur le lien ci-dessous pour choisir votre mot de passe :
   ${setupUrl}

2. Une fois votre mot de passe créé, vous serez dirigé(e) vers la page de connexion.
   Entrez votre adresse e-mail et le mot de passe que vous venez de choisir.

3. Vous êtes connecté(e) !

─────────────────────────────────
COMMENT REVENIR SUR LA PLATEFORME ?
─────────────────────────────────

• Depuis votre navigateur internet :
  Tapez l'adresse suivante : www.resapresta.fr

• Si vous utilisez Passerelle Cap :
  Rendez-vous dans l'onglet « Gestion des ateliers »

─────────────────────────────────

Votre identifiant de connexion : ${to}

Important : ce lien est valable ${INVITATION_VALIDITY_DAYS} jours.
Passé ce délai, un nouveau lien vous sera nécessaire.

─────────────────────────────────
BESOIN D'AIDE ?
─────────────────────────────────

Notre service support est à votre disposition pour toute question :
📧 pole-it@fevesguadeloupeetsaintmartin.fr

⚠️  Ce message est envoyé automatiquement — merci de ne pas y répondre directement.
    Toute demande adressée à cette boîte ne sera pas traitée.

─────────────────────────────────

Cordialement,
L'équipe Cap pour FEVES Guadeloupe`;

  return {
    subject: "Votre accès à ResaPresta — Configurez votre mot de passe",
    text: body,
  };
}
