"use client";

import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { useEffect, useRef } from "react";

/** Reports each finished tool call of a chat once; `reset` forgets the calls already reported. */
export function useToolResults(
  messages: UIMessage[],
  onToolResult?: (toolName: string, output: unknown) => void,
) {
  const processed = useRef(new Set<string>());

  useEffect(() => {
    if (!onToolResult) return;
    for (const message of messages) {
      for (const part of message.parts) {
        if (!isToolUIPart(part) || part.state !== "output-available") continue;
        if (processed.current.has(part.toolCallId)) continue;
        processed.current.add(part.toolCallId);
        onToolResult(getToolName(part), part.output);
      }
    }
  }, [messages, onToolResult]);

  return { reset: () => processed.current.clear() };
}
