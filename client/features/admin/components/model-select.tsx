import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { findCatalogProvider } from "@/lib/llm/catalog";

type ModelSelectProps = {
  provider?: NonNullable<ReturnType<typeof findCatalogProvider>>;
  value?: string;
  onChange: (model: string) => void;
};

/** The models of the chosen provider; disabled until one is chosen. */
export function ModelSelect({ provider, value, onChange }: ModelSelectProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="llm-model">Modelo</Label>
      <Select value={value} onValueChange={onChange} disabled={!provider}>
        <SelectTrigger id="llm-model" className="w-full">
          <SelectValue placeholder="Escolha um modelo" />
        </SelectTrigger>
        <SelectContent>
          {provider?.models.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
