import Image from "next/image";
import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

/** Centered card with the Moura logo, shared by the login and access pages. */
export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6 rounded-xl border bg-card p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg dark:bg-white/90">
          <Image
            src="/brand/moura-logo.png"
            alt="Moura"
            width={34}
            height={34}
            priority
          />
        </div>
        <div className="grid leading-tight">
          <span className="font-semibold">Moura Engenharia</span>
          <span className="text-xs text-muted-foreground">
            Prevenção contra incêndio
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
