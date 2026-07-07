// Doit correspondre à la date "Dernière mise à jour" affichée sur /legal/cgu
export const CURRENT_CGU_VERSION = "2026-07";

// Rôles devant explicitement accepter les CGU en cours pour accéder à leur espace.
// Extension future possible à "referent" — jamais à "super_admin"/"project_admin".
export const ROLES_REQUIRING_CGU = ["provider"] as const;
