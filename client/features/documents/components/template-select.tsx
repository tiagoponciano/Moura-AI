import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TemplateEntry } from "../lib/templates";

type TemplateSelectProps = {
  templates: TemplateEntry[];
  value: string;
  onChange: (id: string) => void;
};

/** Borderless template switcher shown as the workspace title. */
export function TemplateSelect({
  templates,
  value,
  onChange,
}: TemplateSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label="Trocar modelo"
        className="-ml-2 max-w-72 border-0 bg-transparent font-medium shadow-none hover:bg-muted dark:bg-transparent dark:hover:bg-muted"
      >
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
