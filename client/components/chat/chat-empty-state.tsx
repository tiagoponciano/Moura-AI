import { AssistantAvatar } from "./assistant-avatar";

type ChatEmptyStateProps = {
  text: string;
};

export function ChatEmptyState({ text }: ChatEmptyStateProps) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4 text-center">
      <AssistantAvatar className="size-11 rounded-full [&>svg]:size-5" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
