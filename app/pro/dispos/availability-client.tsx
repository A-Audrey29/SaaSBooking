"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAvailabilityAction, deleteAvailabilityAction } from "./actions";
import type { ProviderAvailabilityRow } from "@/server/queries/provider-availability";

function formatDatetimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDisplay(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

interface Props {
  initialAvailabilities: ProviderAvailabilityRow[];
}

export function AvailabilityClient({ initialAvailabilities }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const startAt = new Date(fd.get("startAt") as string);
    const endAt = new Date(fd.get("endAt") as string);
    startTransition(async () => {
      const res = await createAvailabilityAction({ startAt, endAt });
      if (!res.ok) setError(res.error);
    });
    (e.target as HTMLFormElement).reset();
  }

  function handleDelete(availabilityId: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteAvailabilityAction({ availabilityId });
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-8">
      {/* Add form */}
      <div className="border rounded-lg p-4 space-y-4 max-w-md">
        <h2 className="font-medium">Ajouter un créneau</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="startAt">Début</Label>
            <Input id="startAt" name="startAt" type="datetime-local" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endAt">Fin</Label>
            <Input id="endAt" name="endAt" type="datetime-local" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isPending} size="sm">
            {isPending ? "Enregistrement…" : "Ajouter"}
          </Button>
        </form>
      </div>

      {/* List */}
      <div className="space-y-2">
        <h2 className="font-medium">Mes créneaux</h2>
        {initialAvailabilities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun créneau déclaré.</p>
        ) : (
          <ul className="space-y-2">
            {initialAvailabilities.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between border rounded-md px-4 py-2 text-sm"
              >
                <span>
                  {formatDisplay(new Date(a.startAt))} → {formatDisplay(new Date(a.endAt))}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(a.id)}
                  className="text-destructive hover:text-destructive"
                >
                  Supprimer
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
