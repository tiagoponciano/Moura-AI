"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/sign-out";

export function SignOutButton() {
  return (
    <Button variant="outline" onClick={signOut}>
      <LogOut />
      Sair e usar outra conta
    </Button>
  );
}
