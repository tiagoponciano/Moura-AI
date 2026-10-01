"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { SidebarMenuButton } from "@/components/ui/sidebar";

const options = [
  { value: "light", label: "Tema claro", icon: Sun },
  { value: "dark", label: "Tema escuro", icon: Moon },
  { value: "system", label: "Tema do sistema", icon: Monitor },
] as const;

const subscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // The stored theme is only known on the client; render "system" during SSR to avoid a hydration mismatch.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  const index = Math.max(0, options.findIndex((option) => option.value === (mounted ? theme : "system")));
  const current = options[index];
  const next = options[(index + 1) % options.length];
  const Icon = current.icon;

  return (
    <SidebarMenuButton onClick={() => setTheme(next.value)} tooltip={current.label}>
      <Icon />
      <span>{current.label}</span>
    </SidebarMenuButton>
  );
}
