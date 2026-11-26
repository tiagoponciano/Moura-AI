import { Monitor, Moon, Sun } from "lucide-react";

/** The themes a user can pick, as the menus list them. */
export const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const;
