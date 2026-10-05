import { AssistantAvatar } from "./assistant-avatar";

type ChatEmptyStateProps = {
  text: string;
  suggestions: string[];
  onSuggestion: (suggestion: string) => void;
};

export function ChatEmptyState({
  text,
  suggestions,
  onSuggestion,
}: ChatEmptyStateProps) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4 text-center">
      <AssistantAvatar className="size-11 rounded-full [&>svg]:size-5" />
      <p className="text-sm text-muted-foreground">{text}</p>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestion(suggestion)}
              className="rounded-full border bg-background px-3 py-1.5 text-left text-xs transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
