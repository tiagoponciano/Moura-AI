import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export function AssistantAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary",
        className,
      )}
    >
      <Bot className="size-4" />
    </div>
  );
}
