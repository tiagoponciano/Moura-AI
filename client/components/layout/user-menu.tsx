"use client";

import { useEffect, useState } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SignedInUser = { name: string; email: string; avatarUrl?: string };

/** The signed-in user: avatar, name and role. Renders nothing without Supabase or a readable session. */
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

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          tooltip={user.email}
          className="cursor-default"
        >
          <UserAvatar name={user.name} avatarUrl={user.avatarUrl} />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {isAdmin ? "Administrador" : "Equipe"}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
