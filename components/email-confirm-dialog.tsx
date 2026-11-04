"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EmailPreviewResult } from "@/server/lib/email";

interface EmailConfirmDialogProps {
  open: boolean;
  email: string;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
  /**
   * Optional: server action returning the exact email that will be sent.
   * Called each time the dialog opens. Preview failure never blocks sending.
   */
  loadPreview?: () => Promise<EmailPreviewResult>;
}

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: EmailPreviewResult };

export function EmailConfirmDialog({
  open,
  email,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  isPending = false,
  loadPreview,
}: EmailConfirmDialogProps) {
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });

  useEffect(() => {
    if (!open || !loadPreview) {
      setPreview({ status: "idle" });
      return;
    }
    // Ignore a late response if the dialog was closed/reopened meanwhile
    let stale = false;
    setPreview({ status: "loading" });
    loadPreview()
      .then((result) => {
        if (!stale) setPreview({ status: "done", result });
      })
      .catch((e: unknown) => {
        if (!stale) {
          setPreview({
            status: "done",
            result: { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" },
          });
        }
      });
    return () => {
      stale = true;
    };
    // loadPreview is an inline closure in callers: only re-run when the dialog opens/closes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialogContent className={loadPreview ? "max-w-2xl" : undefined}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}{" "}
            <span className="font-medium text-foreground">{email}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {loadPreview && <EmailPreviewBlock state={preview} />}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isPending}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EmailPreviewBlock({ state }: { state: PreviewState }) {
  if (state.status === "idle") return null;
  if (state.status === "loading") {
    return <p className="text-sm text-muted-foreground">Chargement de l&apos;aperçu…</p>;
  }
  if (!state.result.ok) {
    return (
      <p className="text-sm text-red-700">Aperçu indisponible : {state.result.error}</p>
    );
  }
  if (!state.result.preview) {
    return <p className="text-sm text-muted-foreground">Aucun email ne sera envoyé.</p>;
  }

  const { to, subject, text } = state.result.preview;
  return (
    <div className="space-y-2 text-sm min-w-0">
      <div>
        <span className="text-muted-foreground">À : </span>
        <span className="font-medium break-all">{to}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Sujet : </span>
        <span className="font-medium">{subject}</span>
      </div>
      <pre className="whitespace-pre-wrap break-words font-sans text-xs border rounded-md bg-muted/50 p-3 max-h-72 overflow-y-auto">
        {text}
      </pre>
    </div>
  );
}
