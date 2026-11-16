import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROPOSAL_PLANS } from "../lib/proposal";

type PlanFieldProps = { value: string; onChange: (planId: string) => void };

/** The plan of the proposal: a menu when there is a choice, plain text when there is one plan. */
export function PlanField({ value, onChange }: PlanFieldProps) {
  const [only] = PROPOSAL_PLANS;
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs">Plano</Label>
      {PROPOSAL_PLANS.length === 1 ? (
        <p className="flex h-9 items-center text-sm font-medium">
          {only.title}
        </p>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger aria-label="Plano">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROPOSAL_PLANS.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
