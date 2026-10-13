import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type SetupNoticeProps = { children: ReactNode };

/** Highlighted warning about configuration the chats still need. */
export function SetupNotice({ children }: SetupNoticeProps) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-primary/30 bg-accent/60 px-4 py-3 text-sm text-accent-foreground">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
