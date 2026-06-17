import { z } from "zod";

export const METIER_COLORS = [
  { label: "Corail",          value: "#D94F3D" },
  { label: "Orange",          value: "#C46B00" },
  { label: "Moutarde",        value: "#A07800" },
  { label: "Vert forêt",      value: "#2E7D32" },
  { label: "Turquoise",       value: "#00796B" },
  { label: "Bleu océan",      value: "#1565C0" },
  { label: "Bleu royal",      value: "#1976D2" },
  { label: "Violet",          value: "#6A1B9A" },
  { label: "Rose framboise",  value: "#AD1457" },
  { label: "Menthe foncée",   value: "#00695C" },
] as const;

export const METIER_COLOR_VALUES = METIER_COLORS.map((c) => c.value) as [string, ...string[]];

const colorSchema = z.enum(METIER_COLOR_VALUES).optional().nullable();

export const CreateMetierSchema = z.object({
  nom: z.string().min(2).max(100).trim(),
  color: colorSchema,
});

export const UpdateMetierSchema = z.object({
  id: z.string().uuid(),
  nom: z.string().min(2).max(100).trim(),
  color: colorSchema,
});

export const SoftDeleteMetierSchema = z.object({
  id: z.string().uuid(),
});

export type CreateMetierInput = z.infer<typeof CreateMetierSchema>;
export type UpdateMetierInput = z.infer<typeof UpdateMetierSchema>;
export type SoftDeleteMetierInput = z.infer<typeof SoftDeleteMetierSchema>;
