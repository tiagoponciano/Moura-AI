import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SetupProblem } from "../lib/sections";

type SetupBannerProps = {
  problem: SetupProblem;
  /** Label of the saved provider, for the missing-key message. */
  providerLabel?: string;
  /** Opens the AI model section; the server-side problem shows no button. */
  onFix: () => void;
};

const MESSAGES: Record<SetupProblem, (provider?: string) => string> = {
  service_role: () =>
    "SUPABASE_SERVICE_ROLE_KEY não está configurada no servidor. Defina-a nas variáveis de ambiente do deploy.",
  no_model: () => "Nenhum modelo de IA foi escolhido.",
  no_key: (provider) =>
    `O provedor salvo${provider ? ` (${provider})` : ""} não tem chave de API cadastrada.`,
};

const ACTIONS: Partial<Record<SetupProblem, string>> = {
  no_model: "Escolher modelo",
  no_key: "Cadastrar chave",
};

/** The one thing stopping the chats right now, with a shortcut to fix it. */
export function SetupBanner({
  problem,
  providerLabel,
  onFix,
}: SetupBannerProps) {
  const action = ACTIONS[problem];

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl bg-accent px-4 py-3.5 text-accent-foreground"
    >
      <TriangleAlert className="size-[18px] shrink-0" />
      <p className="min-w-0 flex-[1_1_320px] text-sm leading-relaxed">
        <span className="font-semibold">As conversas estão paradas.</span>{" "}
        {MESSAGES[problem](providerLabel)}
      </p>
      {action && (
        <Button variant="outline" size="sm" onClick={onFix}>
          {action}
        </Button>
      )}
    </div>
  );
}
