"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Erreur</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button
        onClick={reset}
        className="self-start px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
      >
        Réessayer
      </button>
    </div>
  );
}
