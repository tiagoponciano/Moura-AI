"use client";

import { usePathname } from "next/navigation";
import { ADMIN_PATH } from "@/lib/auth/gate";
import { findModule } from "@/lib/modules";

export function PageTitle() {
  const pathname = usePathname();
  const current =
    findModule(pathname) ??
    (pathname.startsWith(ADMIN_PATH) ? { label: "Administração" } : undefined);

  return (
    <nav
      aria-label="Localização"
      className="flex min-w-0 items-center gap-1.5 text-sm"
    >
      <span className="text-muted-foreground">Moura Engenharia</span>
      {current && (
        <>
          <span className="text-muted-foreground/60">/</span>
          <span className="truncate font-medium">{current.label}</span>
        </>
      )}
    </nav>
  );
}
