import { cn } from "@/lib/utils";

export type WorkspaceTab = "chat" | "fields";

type WorkspaceTabsProps = {
  value: WorkspaceTab;
  onChange: (tab: WorkspaceTab) => void;
  /** Short progress shown next to "Campos", e.g. "3/5". */
  fieldsBadge: string;
  className?: string;
};

/** Chat / fields switch for narrow screens, where only one pane fits. */
export function WorkspaceTabs({
  value,
  onChange,
  fieldsBadge,
  className,
}: WorkspaceTabsProps) {
  const tabs = [
    { id: "chat", label: "Conversa" },
    { id: "fields", label: `Campos ${fieldsBadge}` },
  ] as const;

  return (
    <div role="tablist" className={cn("flex gap-1 border-b p-2", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "h-8 flex-1 rounded-md text-sm text-muted-foreground tabular-nums transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            value === tab.id && "bg-muted font-medium text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
