import { AuthCard } from "./auth-card";
import { SignOutButton } from "./sign-out-button";

export function PendingCard() {
  return (
    <AuthCard
      title="Acesso aguardando aprovação"
      description="Seu cadastro foi registrado. Um administrador da Moura precisa aprovar o acesso antes de você usar a plataforma."
    >
      <SignOutButton />
    </AuthCard>
  );
}
