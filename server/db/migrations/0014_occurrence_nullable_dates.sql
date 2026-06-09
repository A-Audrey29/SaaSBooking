-- Migration 0014 : rendre start_at et end_at nullable sur occurrence
-- Raison métier : les dates sont fixées lors du choix des dispos prestataires,
--                 pas au moment de la création de la session.
-- rollback: ALTER TABLE occurrence ALTER COLUMN start_at SET NOT NULL;
-- rollback: ALTER TABLE occurrence ALTER COLUMN end_at SET NOT NULL;

ALTER TABLE occurrence ALTER COLUMN start_at DROP NOT NULL;
ALTER TABLE occurrence ALTER COLUMN end_at DROP NOT NULL;
