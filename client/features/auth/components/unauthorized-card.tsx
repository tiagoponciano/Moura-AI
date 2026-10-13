import { AuthCard } from "./auth-card";
import { SignOutButton } from "./sign-out-button";

export function UnauthorizedCard() {
  return (
    <AuthCard
      title="Acesso não autorizado"
      description="Esta conta não tem acesso à plataforma. Entre com a conta da Moura ou fale com um administrador."
    >
      <SignOutButton />
    </AuthCard>
  );
}
