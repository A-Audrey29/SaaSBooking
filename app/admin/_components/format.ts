/**
 * Display helpers shared by admin supervision screens (dashboard, réservations, journal, users).
 * Pure functions, safe in server and client components.
 *
 * Time zone is explicit: server components run on Render in UTC,
 * V1 users are in Guadeloupe (see tech-debt note for V2 France).
 */

const TZ = "America/Guadeloupe";

const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TZ,
});

export function formatDateTime(d: Date | string | null | undefined): string {
  return d ? dateTimeFmt.format(new Date(d)) : "—";
}

export function formatDate(d: Date | string | null | undefined): string {
  return d ? dateFmt.format(new Date(d)) : "—";
}

/** "il y a 3 j" style, for last login / pending age. */
export function formatAgo(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const minutes = Math.floor((Date.now() - new Date(d).getTime()) / 60_000);
  if (minutes < 60) return `il y a ${Math.max(minutes, 1)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}

export const SLOT_STATUT_LABEL: Record<string, string> = {
  empty: "Vide",
  pending: "En attente",
  confirmed: "Confirmée",
  refused: "Refusée",
  cancelled: "Annulée",
  done: "Réalisée",
  skipped: "Ignorée",
};

/** Tailwind classes per ticket slot statut (badge colours). */
export const SLOT_STATUT_CLASS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  refused: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
  done: "bg-blue-100 text-blue-800",
};

export const EMAIL_TYPE_LABEL: Record<string, string> = {
  invitation: "Invitation",
  assignment: "Demande prestataire",
  cancellation: "Annulation",
  password_reset: "Mot de passe oublié",
  contact: "Formulaire contact",
};

export const EMAIL_STATUS_LABEL: Record<string, string> = {
  sent: "Envoyé",
  failed: "Échec",
  skipped: "Non envoyé (dev)",
};

export const EMAIL_STATUS_CLASS: Record<string, string> = {
  sent: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  skipped: "bg-gray-100 text-gray-700",
};

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  create: "Création",
  update: "Modification",
  soft_delete: "Suppression",
};

export const ENTITY_TYPE_LABEL: Record<string, string> = {
  centre: "Centre",
  project: "Projet",
  project_centre: "Projet ↔ centre",
  provider: "Prestataire",
  provider_assignment: "Affectation prestataire",
  session_group: "Session",
  ticket_slot: "Demande",
  user: "Utilisateur",
  workshop: "Atelier",
  workshop_type: "Type d'atelier",
  workshop_role_group: "Groupe de rôles",
  workshop_role_slot: "Rôle d'atelier",
  metier: "Métier",
};

/** Shared classes for native <select> in GET filter forms (no client JS needed). */
export const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";
