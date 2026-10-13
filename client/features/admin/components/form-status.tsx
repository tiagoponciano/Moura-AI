import { cn } from "cn";

export type FormStatusState =
  | { kind: "idle" }
  | { kind: "saved"; text: string }
  | { kind: "error"; text: string };

/** One line under a form: confirmation or the server's error message. */
export function FormStatus({ state }: { state: FormStatusState }) {
  if (state.kind === "idle") return null;
  return (
    <p
      role={state.kind === "error" ? "alert" : "status"}
      className={cn(
        "text-xs",
        state.kind === "error" ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {state.text}
    </p>
  );
}
