import Link from "next/link";
import { FileText, Layers, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  { href: "/documents", label: "Documentos", icon: FileText },
  { href: "/classification", label: "Classificação", icon: Layers },
  { href: "/floor-plans", label: "Plantas", icon: MapIcon },
];

/** The tools that work on the chosen project. They open on it, and come inside it in a later step. */
export function ProjectSections() {
  return (
    <nav aria-label="Seções do projeto" className="flex flex-wrap gap-2">
      {SECTIONS.map(({ href, label, icon: Icon }) => (
        <Button key={href} asChild variant="outline">
          <Link href={href}>
            <Icon /> {label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
