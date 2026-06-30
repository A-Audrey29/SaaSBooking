import "server-only";

import { Resend } from "resend";

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

export async function sendInvitationEmail({
  to,
  name,
  inviterName,
  token,
}: SendInvitationEmailParams): Promise<SendInvitationEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const setupUrl = `${appUrl}/setup-password?token=${token}`;
  const displayName = name ?? to;

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

Important : ce lien est valable 7 jours.
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

  if (!process.env.RESEND_API_KEY || process.env.NODE_ENV !== "production") {
    console.log("[send-invitation] Email non envoyé (dev/missing key)", {
      to,
      setupUrl,
    });
    return { sent: false };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@resapresta.fr",
      to,
      subject: "Votre accès à ResaPresta — Configurez votre mot de passe",
      text: body,
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[send-invitation] Échec envoi Resend", { to, error: message });
    return { sent: false, error: message };
  }
}
