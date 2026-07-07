"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CguAcceptanceField } from "@/components/cgu-acceptance-field";
import { AcceptCguSchema, type AcceptCguInput } from "@/server/validations/user";
import { acceptCgu } from "@/app/admin/users/users.actions";

export function AcceptCguClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<AcceptCguInput>({
    resolver: zodResolver(AcceptCguSchema),
    defaultValues: {
      cguAccepted: undefined,
    },
  });

  const cguAccepted = form.watch("cguAccepted");

  const onSubmit = (data: AcceptCguInput) => {
    startTransition(async () => {
      const result = await acceptCgu(data);
      if (result.ok) {
        router.push("/pro");
      } else {
        form.setError("root", { message: result.error });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Mise à jour des conditions d&apos;utilisation</h1>
          <p className="text-muted-foreground">
            Les conditions générales d&apos;utilisation de ResaPresta ont évolué. Merci de les consulter
            et de les accepter pour continuer à accéder à votre espace.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CguAcceptanceField control={form.control} name="cguAccepted" />

            {form.formState.errors.root && (
              <div className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending || !cguAccepted}>
              {isPending ? "Validation…" : "Continuer"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
