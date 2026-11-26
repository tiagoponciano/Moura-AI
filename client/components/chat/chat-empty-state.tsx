type ChatEmptyStateProps = {
  text: string;
};

export function ChatEmptyState({ text }: ChatEmptyStateProps) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
