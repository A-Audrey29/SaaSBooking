"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignProviderToSlot, cancelSlotRequest, skipSlot } from "./session.actions";
import type { SessionGroupDetail } from "@/server/queries/session-group";
import type { ProviderForSlot } from "@/server/queries/ticket-slot";

const STATUT_BADGE: Record<string, { label: string; className: string }> = {
  empty: { label: "À pourvoir", className: "bg-slate-100 text-slate-700 border-slate-200" },
  pending: { label: "En attente", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmed: { label: "Confirmé", className: "bg-green-100 text-green-800 border-green-200" },
  refused: { label: "Refusé", className: "bg-red-100 text-red-800 border-red-200" },
  skipped: { label: "Non requis", className: "bg-slate-100 text-slate-500 border-slate-200" },
  cancelled: { label: "Annulé", className: "bg-stone-100 text-stone-600 border-stone-200" },
  done: { label: "Réalisé", className: "bg-blue-100 text-blue-800 border-blue-200" },
};

const OCCURRENCE_STATUT_BADGE: Record<string, { label: string; className: string }> = {
  planned: { label: "Planifiée", className: "bg-slate-100 text-slate-700 border-slate-200" },
  confirmed: { label: "Confirmée", className: "bg-green-100 text-green-800 border-green-200" },
  completed: { label: "Réalisée", className: "bg-blue-100 text-blue-800 border-blue-200" },
  cancelled: { label: "Annulée", className: "bg-red-100 text-red-800 border-red-200" },
};

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-GP", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Guadeloupe",
  }).format(new Date(date));
}

type Ticket = NonNullable<SessionGroupDetail["occurrences"][number]["ticket"]>;
type Slot = Ticket["slots"][number];
type Occurrence = SessionGroupDetail["occurrences"][number];

interface SlotRowProps {
  slot: Slot;
  providers: ProviderForSlot[];
  sessionGroupId: string;
}

function SlotRow({ slot, providers, sessionGroupId }: SlotRowProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const badge = STATUT_BADGE[slot.statut] ?? { label: slot.statut, className: "" };

  const handleAssign = () => {
    if (!selectedProviderId) return;
    setError(null);
    startTransition(async () => {
      const result = await assignProviderToSlot({ slotId: slot.id, providerId: selectedProviderId, sessionGroupId });
      if (!result.ok) setError(result.error);
    });
  };

  const handleCancel = () => {
    setError(null);
    startTransition(async () => {
      const result = await cancelSlotRequest({ slotId: slot.id, sessionGroupId });
      if (!result.ok) setError(result.error);
    });
  };

  const handleSkip = () => {
    setError(null);
    startTransition(async () => {
      const result = await skipSlot({ slotId: slot.id, sessionGroupId });
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-2 py-2 border-b last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium uppercase tracking-wide">{slot.providerRole}</span>
        <Badge
          variant="outline"
          className={`text-xs ${badge.className}`}
        >
          {badge.label}
        </Badge>
      </div>

      {slot.statut === "empty" && (
        <div className="space-y-2">
          {providers.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun prestataire affecté à ce projet.</p>
          ) : (
            <div className="flex gap-2 items-center">
              <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                <SelectTrigger className="h-8 text-xs w-[200px]">
                  <SelectValue placeholder="Choisir un prestataire" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom}{p.ville ? ` · ${p.ville}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleAssign}
                disabled={!selectedProviderId || isPending}
              >
                Assigner
              </Button>
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground"
            onClick={handleSkip}
            disabled={isPending}
          >
            Passer en non requis
          </Button>
        </div>
      )}

      {slot.statut === "pending" && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {slot.provider?.nom ?? "Prestataire inconnu"}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleCancel}
            disabled={isPending}
          >
            Annuler la demande
          </Button>
        </div>
      )}

      {slot.statut === "refused" && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Refusé par {slot.provider?.nom ?? "prestataire inconnu"}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground"
            onClick={handleSkip}
            disabled={isPending}
          >
            Passer en non requis
          </Button>
        </div>
      )}

      {slot.statut === "skipped" && (
        <p className="text-xs text-muted-foreground">Non requis pour cette séance</p>
      )}

      {slot.statut === "confirmed" && (
        <span className="text-xs text-muted-foreground">{slot.provider?.nom}</span>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface OccurrenceCardProps {
  occ: Occurrence;
  providersMap: Record<string, ProviderForSlot[]>;
  sessionGroupId: string;
}

function OccurrenceCard({ occ, providersMap, sessionGroupId }: OccurrenceCardProps) {
  const badge = OCCURRENCE_STATUT_BADGE[occ.statut] ?? { label: occ.statut, className: "" };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold">S{occ.index}</span>
          <span className="text-sm text-muted-foreground ml-2">
            {formatDate(occ.startAt)} → {formatDate(occ.endAt)}
          </span>
        </div>
        <Badge variant="outline" className={`text-xs ${badge.className}`}>
          {badge.label}
        </Badge>
      </div>

      {occ.ticket && occ.ticket.slots.length > 0 ? (
        <div className="divide-y">
          {occ.ticket.slots.map((slot) => (
            <SlotRow
              key={slot.id}
              slot={slot}
              providers={providersMap[slot.id] ?? []}
              sessionGroupId={sessionGroupId}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Aucun rôle défini pour cette séance.</p>
      )}
    </div>
  );
}

interface Props {
  detail: SessionGroupDetail;
  providersMap: Record<string, ProviderForSlot[]>;
  sessionGroupId: string;
}

export function SessionDetailClient({ detail, providersMap, sessionGroupId }: Props) {
  if (detail.occurrences.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Aucune séance planifiée pour cette session.</p>
    );
  }

  return (
    <div className="space-y-4">
      {detail.occurrences.map((occ) => (
        <OccurrenceCard
          key={occ.id}
          occ={occ}
          providersMap={providersMap}
          sessionGroupId={sessionGroupId}
        />
      ))}
    </div>
  );
}
