-- Migration: add session_number and seance_number to session_group
-- rollback: ALTER TABLE session_group DROP COLUMN session_number; ALTER TABLE session_group DROP COLUMN seance_number;

ALTER TABLE session_group
  ADD COLUMN session_number INTEGER,
  ADD COLUMN seance_number  INTEGER;
