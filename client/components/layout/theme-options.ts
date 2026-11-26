import { Monitor, Moon, Sun } from "lucide-react";

/** The themes a user can pick, as the menus list them. */
export const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const;

const MODE_LABELS: Record<string, string> = {
  light: "Modo claro",
  dark: "Modo escuro",
  system: "Modo do sistema",
};

/** What the sidebar's theme button says for the saved theme; "Tema" when none is known yet. */
export const themeLabel = (theme: string | undefined) =>
  (theme && MODE_LABELS[theme]) || "Tema";
