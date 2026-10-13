import type { ReactNode } from "react";

type ChatAlertProps = { children: ReactNode };

/** Error line inside the message list. */
export function ChatAlert({ children }: ChatAlertProps) {
  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
    >
      {children}
    </div>
  );
}
