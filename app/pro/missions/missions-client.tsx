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

function formatTime(date: Date | string | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-GP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Guadeloupe",
  }).format(new Date(date));
}

interface MissionsClientProps {
  slots: ProviderMissionRow[];
}

export function MissionsClient({ slots }: MissionsClientProps) {
  const pending = slots.filter((s) => s.statut === "pending");
  const confirmed = slots.filter((s) => s.statut === "confirmed");
  const cancelled = slots.filter((s) => s.statut === "empty");

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

function SlotDetails({ slot }: { slot: ProviderMissionRow }) {
  const sessionLabel = slot.sessionNumber != null ? `Session ${slot.sessionNumber}` : null;
  const seanceLabel = slot.occurrenceIndex != null ? `Séance ${slot.occurrenceIndex}` : null;
  const seanceInfo = [sessionLabel, seanceLabel].filter(Boolean).join(" · ");

  const timeRange = slot.startAt && slot.endAt
    ? `${formatTime(slot.startAt)}–${formatTime(slot.endAt)}`
    : null;

  const dateTime = [formatDate(slot.startAt), timeRange].filter(Boolean).join(" · ");
  const adresse = [slot.centreAdresse, slot.centreVille].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-sm font-semibold">Atelier : {slot.workshopNom}</span>
      <span className="text-xs text-muted-foreground">
        {[seanceInfo, dateTime].filter(Boolean).join(" · ")}
      </span>
      {slot.centreNom && (
        <span className="text-xs text-muted-foreground">
          {slot.centreNom}{adresse ? ` · ${adresse}` : ""}
        </span>
      )}
      {slot.referentName && (
        <span className="text-xs text-muted-foreground">
          Demande de : {slot.referentName}
          {slot.referentEmail && (
            <> · <a
              href={`mailto:${slot.referentEmail}`}
              className="underline underline-offset-2 hover:text-foreground"
            >{slot.referentEmail}</a></>
          )}
        </span>
      )}
    </div>
  );
}

function PendingRow({ slot }: { slot: ProviderMissionRow }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-start justify-between gap-4 px-4 py-4">
      <SlotDetails slot={slot} />
      <div className="flex items-center gap-2 shrink-0 pt-0.5">
        <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
          En attente
        </Badge>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-3 text-xs border-green-600 text-green-700 hover:bg-green-50"
          onClick={() => startTransition(async () => { await acceptSlot({ slotId: slot.slotId }); })}
          disabled={isPending}
        >
          Accepter
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => startTransition(async () => { await rejectSlot({ slotId: slot.slotId }); })}
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
    <div className="flex items-start justify-between gap-4 px-4 py-4">
      <SlotDetails slot={slot} />
      <div className="shrink-0 pt-0.5">
        <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
          Confirmée
        </Badge>
      </div>
    </div>
  );
}

function CancelledRow({ slot }: { slot: ProviderMissionRow }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-start justify-between gap-4 px-4 py-4">
      <SlotDetails slot={slot} />
      <div className="flex items-center gap-2 shrink-0 pt-0.5">
        <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-200">
          Annulée
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => startTransition(async () => { await dismissCancelledSlot({ slotId: slot.slotId }); })}
          disabled={isPending}
          aria-label="Supprimer"
        >
          ✕
        </Button>
      </div>
    </div>
  );
}
