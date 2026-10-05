import { CircleDashed, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ComingSoonProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  plans?: string[];
};

export function ComingSoon({
  title,
  description,
  icon: Icon,
  plans = [],
}: ComingSoonProps) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex w-full max-w-lg flex-col gap-6 rounded-xl border bg-card p-6 md:p-8">
        <div className="flex items-start justify-between">
          <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-5" />
          </div>
          <Badge variant="outline">Em breve</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {plans.length > 0 && (
          <div className="flex flex-col gap-3 border-t pt-5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              O que está previsto
            </p>
            <ul className="flex flex-col gap-2 text-sm">
              {plans.map((plan) => (
                <li key={plan} className="flex gap-2">
                  <CircleDashed className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{plan}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
