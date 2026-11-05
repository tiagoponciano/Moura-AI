import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssistantState } from "../lib/cbmsc-forms";

type AssistantButtonProps = {
  state: AssistantState;
  onClick: () => void;
};

const LABELS: Record<AssistantState, string> = {
  unavailable: "Assistente em preparação",
  checking: "Conferindo a versão…",
  ready: "Preencher com o assistente",
  unverified: "Preencher com o assistente",
  outdated: "Modelo em revisão",
};

/** Opens the form's chat; disabled, and says why, when it cannot be used. */
export function AssistantButton({ state, onClick }: AssistantButtonProps) {
  return (
    <Button
      size="sm"
      disabled={state !== "ready" && state !== "unverified"}
      onClick={onClick}
    >
      {state === "checking" ? (
        <Loader2 className="animate-spin" />
      ) : (
        <MessageSquare />
      )}
      {LABELS[state]}
    </Button>
  );
}
