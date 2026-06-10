"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Metier {
  id: string;
  nom: string;
}

interface Provider {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  ville: string | null;
  metierId: string | null;
  metierNom: string | null;
  bio: string | null;
  createdAt: Date;
}

interface ProvidersDirectoryClientProps {
  providers: Provider[];
  metiers: Metier[];
}

const ALL_METIERS = "all";

function getInitials(nom: string): string {
  const parts = nom.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function ProvidersDirectoryClient({ providers, metiers }: ProvidersDirectoryClientProps) {
  const [search, setSearch] = useState("");
  const [metierFilter, setMetierFilter] = useState(ALL_METIERS);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const filteredProviders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return providers.filter((provider) => {
      const matchesMetier =
        metierFilter === ALL_METIERS || provider.metierId === metierFilter;

      if (!matchesMetier) return false;
      if (!query) return true;

      const haystack = `${provider.nom} ${provider.ville ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [providers, search, metierFilter]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto">
      <h1 className="text-h-2xl font-semibold tracking-tight">Annuaire prestataires</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {filteredProviders.length} prestataire{filteredProviders.length > 1 ? "s" : ""}.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Input
          placeholder="Rechercher un nom ou une ville..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:flex-1"
        />
        <Select value={metierFilter} onValueChange={setMetierFilter}>
          <SelectTrigger className="sm:w-[220px]">
            <SelectValue placeholder="Tous les métiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_METIERS}>Tous les métiers</SelectItem>
            {metiers.map((metier) => (
              <SelectItem key={metier.id} value={metier.id}>
                {metier.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredProviders.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-8 text-center">
          Aucun prestataire ne correspond à votre recherche.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {filteredProviders.map((provider) => (
            <Card
              key={provider.id}
              onClick={() => setSelectedProvider(provider)}
              className="flex items-start gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                {getInitials(provider.nom)}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{provider.nom}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {provider.metierNom ?? "—"}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {provider.ville ?? "—"}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={selectedProvider !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedProvider(null);
        }}
      >
        <SheetContent>
          {selectedProvider && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedProvider.nom}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Métier</p>
                  <p className="font-medium">{selectedProvider.metierNom ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ville</p>
                  <p className="font-medium">{selectedProvider.ville ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedProvider.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{selectedProvider.telephone ?? "—"}</p>
                </div>
                {selectedProvider.bio && (
                  <div>
                    <p className="text-muted-foreground">À propos</p>
                    <p className="font-medium whitespace-pre-wrap">{selectedProvider.bio}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
