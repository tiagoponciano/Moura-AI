import { Loader2, Paperclip, SendHorizontal } from "lucide-react";
import {
  useRef,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ATTACHMENT_ACCEPT } from "@/lib/attachments/rules";

type ChatComposerProps = {
  value: string;
  placeholder: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** Shows the attach button when set. */
  onAttach?: (files: File[]) => void;
  attaching?: boolean;
};

/** Message input: Enter sends, Shift+Enter adds a line break. */
export function ChatComposer({
  value,
  placeholder,
  busy,
  onChange,
  onSubmit,
  onAttach,
  attaching = false,
}: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length > 0) onAttach?.(files);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-3">
      <div className="flex items-end gap-2 rounded-xl border bg-background p-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
        {onAttach && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ATTACHMENT_ACCEPT}
              onChange={handleFiles}
              className="hidden"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={attaching}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Anexar arquivo"
                  >
                    {attaching ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Paperclip />
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Anexar PDF, imagem ou DOCX (até 20 MB)
              </TooltipContent>
            </Tooltip>
          </>
        )}
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          className="max-h-40 min-h-11 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <Tooltip>
          {/* The wrapper keeps the tooltip working while the button is disabled. */}
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                type="submit"
                size="icon"
                disabled={busy || !value.trim()}
                aria-label="Enviar"
              >
                {busy ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <SendHorizontal />
                )}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Enter envia · Shift+Enter quebra a linha
          </TooltipContent>
        </Tooltip>
      </div>
    </form>
  );
}
