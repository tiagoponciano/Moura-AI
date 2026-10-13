import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
