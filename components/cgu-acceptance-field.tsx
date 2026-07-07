import type { Control, FieldValues, Path } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface CguAcceptanceFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
}

export function CguAcceptanceField<TFieldValues extends FieldValues>({
  control,
  name,
}: CguAcceptanceFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-start gap-2">
            <FormControl>
              <Checkbox
                checked={field.value === true}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            </FormControl>
            <FormLabel className="text-sm font-normal leading-snug">
              J&apos;ai lu et j&apos;accepte les{" "}
              <a
                href="/legal/cgu"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                CGU
              </a>{" "}
              et la{" "}
              <a
                href="/legal/politique-confidentialite"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Politique de confidentialité
              </a>
              .
            </FormLabel>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
