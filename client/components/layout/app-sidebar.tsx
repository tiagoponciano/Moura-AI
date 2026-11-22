"use client";

import { FolderOpen, House, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/shared/brand-logo";
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
import { UserMenu } from "./user-menu";

/** The active item keeps a neutral background; only its icon takes the brand color. */
const ACTIVE_ICON = "data-[active=true]:[&>svg]:text-sidebar-primary";

/** `isAdmin` only shows the link; the proxy guards `/admin`. */
export function AppSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <BrandLogo size="sm" />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="font-semibold">Moura Engenharia</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Prevenção contra incêndio
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={ACTIVE_ICON}
                    isActive={pathname.startsWith(ADMIN_PATH)}
                    tooltip="Administração"
                  >
                    <Link href={ADMIN_PATH}>
                      <ShieldCheck />
                      <span>Administração</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
        <p className="px-2 pb-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Moura Soluções em Engenharia
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
