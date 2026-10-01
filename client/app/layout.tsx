import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Moura AI",
  description: "Plataforma interna da Moura Soluções em Engenharia",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <TooltipProvider>
          <SidebarProvider className="h-svh">
            <AppSidebar />
            <SidebarInset className="min-h-0 overflow-hidden">
              <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
                <SidebarTrigger />
                <span className="text-sm text-muted-foreground">Moura Soluções em Engenharia</span>
              </header>
              <div className="min-h-0 flex-1 overflow-auto">{children}</div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
