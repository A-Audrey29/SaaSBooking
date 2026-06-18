"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { acceptSlot, rejectSlot, dismissCancelledSlot } from "./missions.actions";
import type { ProviderMissionRow } from "@/server/queries/provider-missions";

function formatDate(date: Date | string | null): string {
  if (!date) return "Date à confirmer";
  return new Intl.DateTimeFormat("fr-GP", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Guadeloupe",
  }).format(new Date(date));
}

interface MissionsClientProps {
  slots: ProviderMissionRow[];
}

export function MissionsClient({ slots }: MissionsClientProps) {
  const pending = slots.filter((s) => s.statut === "pending");
  const cancelled = slots.filter((s) => s.statut === "empty");
  const confirmed = slots.filter((s) => s.statut === "confirmed");

  if (slots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground mt-4">
        Aucune demande en cours.
      </p>
    );
  }

  return (
    <div className="space-y-8 mt-6">
      {pending.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3">En attente de réponse</h2>
          <div className="border rounded-lg divide-y">
            {pending.map((slot) => (
              <PendingRow key={slot.slotId} slot={slot} />
            ))}
          </div>
        </section>
      )}

      {confirmed.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3">Confirmées</h2>
          <div className="border rounded-lg divide-y">
            {confirmed.map((slot) => (
              <ConfirmedRow key={slot.slotId} slot={slot} />
            ))}
          </div>
        </section>
      )}

      {cancelled.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3">Annulées</h2>
          <div className="border rounded-lg divide-y">
            {cancelled.map((slot) => (
              <CancelledRow key={slot.slotId} slot={slot} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SlotInfo({ slot }: { slot: ProviderMissionRow }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-sm font-medium truncate">{slot.sessionNom}</span>
      <span className="text-xs text-muted-foreground">{slot.workshopNom}</span>
      <span className="text-xs text-muted-foreground">{formatDate(slot.startAt)}</span>
    </div>
  );
}

function PendingRow({ slot }: { slot: ProviderMissionRow }) {
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    startTransition(async () => {
      await acceptSlot({ slotId: slot.slotId });
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await rejectSlot({ slotId: slot.slotId });
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <SlotInfo slot={slot} />
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
          En attente
        </Badge>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-3 text-xs border-green-600 text-green-700 hover:bg-green-50"
          onClick={handleAccept}
          disabled={isPending}
        >
          Accepter
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={handleReject}
          disabled={isPending}
        >
          Refuser
        </Button>
      </div>
    </div>
  );
}

function ConfirmedRow({ slot }: { slot: ProviderMissionRow }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <SlotInfo slot={slot} />
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
          Confirmée
        </Badge>
      </div>
    </div>
  );
}

function CancelledRow({ slot }: { slot: ProviderMissionRow }) {
  const [isPending, startTransition] = useTransition();

  const handleDismiss = () => {
    startTransition(async () => {
      await dismissCancelledSlot({ slotId: slot.slotId });
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <SlotInfo slot={slot} />
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-200">
          Annulée
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={handleDismiss}
          disabled={isPending}
          aria-label="Supprimer"
        >
          ✕
        </Button>
      </div>
    </div>
  );
}
