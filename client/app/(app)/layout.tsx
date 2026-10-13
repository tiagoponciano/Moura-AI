import { AppSidebar } from "@/components/layout/app-sidebar";
import { PageTitle } from "@/components/layout/page-title";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { isCurrentUserAdmin } from "@/lib/auth/is-admin";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const isAdmin = await isCurrentUserAdmin();

  return (
    <SidebarProvider className="h-svh">
      <AppSidebar isAdmin={isAdmin} />
      <SidebarInset className="min-h-0 overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="mr-1 data-[orientation=vertical]:h-4"
          />
          <PageTitle />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
