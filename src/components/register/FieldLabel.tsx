import { ReactNode } from "react";
import { FormLabel } from "@/components/ui/form";

export function FieldLabel({ en, ku, required }: { en: string; ku?: string; required?: boolean }) {
  return (
    <FormLabel className="flex items-baseline gap-2">
      <span>
        {en}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      {ku && <span dir="rtl" className="text-xs text-muted-foreground font-normal">{ku}</span>}
    </FormLabel>
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-2xl font-semibold tracking-tight">{children}</h2>
      {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}
