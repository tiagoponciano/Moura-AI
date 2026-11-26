"use client";

import { LogOut } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth/sign-out";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** "Sair" at the very bottom of the sidebar; there is no session to end without Supabase. */
export function SidebarSignOut() {
  if (!isSupabaseConfigured()) return null;
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={signOut} tooltip="Sair">
          <LogOut />
          <span>Sair</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
