"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth/sign-out";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type SignedInUser = { name: string; email: string; avatarUrl?: string };

/** Signed-in user and "Sair". Renders nothing without Supabase; keeps "Sair" when the session cannot be read. */
export function UserMenu({ isAdmin }: { isAdmin: boolean }) {
  const [user, setUser] = useState<SignedInUser>();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    // The session comes from the cookie, with no round trip: the name still shows when Supabase is slow.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const found = data.session?.user;
        if (!found?.email) return;
        const metadata = found.user_metadata;
        setUser({
          email: found.email,
          name: metadata.full_name ?? metadata.name ?? found.email,
          avatarUrl: metadata.avatar_url,
        });
      })
      .catch(() => undefined);
  }, []);

  if (!user) {
    // Without a readable session the way out must still be there.
    return isSupabaseConfigured() ? (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={signOut} tooltip="Sair">
            <LogOut />
            <span>Sair</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    ) : null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={user.name}>
              <UserAvatar name={user.name} avatarUrl={user.avatarUrl} />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {isAdmin ? "Administrador" : "Equipe"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" className="w-56">
            <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOut}>
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
