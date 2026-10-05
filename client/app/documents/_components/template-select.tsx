import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TemplateEntry } from "@/lib/documents/templates";

type TemplateSelectProps = {
  templates: TemplateEntry[];
  value: string;
  onChange: (id: string) => void;
};

export function TemplateSelect({
  templates,
  value,
  onChange,
}: TemplateSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-72" aria-label="Modelo">
        <SelectValue placeholder="Selecione um modelo" />
      </SelectTrigger>
      <SelectContent>
        {templates.map((entry) => (
          <SelectItem key={entry.id} value={entry.id}>
            {entry.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
