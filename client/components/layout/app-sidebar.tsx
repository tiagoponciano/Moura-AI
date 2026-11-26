"use client";

import { FolderOpen, House, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ADMIN_PATH } from "@/lib/auth/gate";
import { MODULES, MODULE_STATUS_LABEL, PROJECTS_PATH } from "@/lib/modules";
import { SidebarProject } from "./sidebar-project";
import { SidebarTheme } from "./sidebar-theme";
import { UserMenu } from "./user-menu";

/** The active item keeps a neutral background; only its icon takes the brand color. */
const ACTIVE_ICON = "data-[active=true]:[&>svg]:text-sidebar-primary";

/** `isAdmin` only shows the link; the proxy guards `/admin`. */
export function AppSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3">
        <SidebarProject />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className={ACTIVE_ICON}
                  isActive={pathname === "/"}
                  tooltip="Início"
                >
                  <Link href="/">
                    <House />
                    <span>Início</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className={ACTIVE_ICON}
                  isActive={pathname.startsWith(PROJECTS_PATH)}
                  tooltip="Projetos"
                >
                  <Link href={PROJECTS_PATH}>
                    <FolderOpen />
                    <span>Projetos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MODULES.map(({ href, label, icon: Icon, status }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    className={ACTIVE_ICON}
                    isActive={pathname.startsWith(href)}
                    tooltip={label}
                  >
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {status !== "available" && (
                    <SidebarMenuBadge className="text-[10px] font-normal text-muted-foreground">
                      {MODULE_STATUS_LABEL[status]}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={ACTIVE_ICON}
                    isActive={pathname.startsWith(ADMIN_PATH)}
                    tooltip="Administração"
                  >
                    <Link href={ADMIN_PATH}>
                      <Lock />
                      <span>Administração</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarTheme />
        <UserMenu isAdmin={isAdmin} />
      </SidebarFooter>
    </Sidebar>
  );
}
