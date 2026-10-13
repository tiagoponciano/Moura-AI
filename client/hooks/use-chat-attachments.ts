"use client";

import { useEffect, useState } from "react";
import {
  AttachmentUploadError,
  fetchAttachments,
  uploadAttachment,
} from "@/lib/attachments/client";
import type { Attachment } from "@/lib/attachments/types";

/** Files attached to one chat: loads them when the chat changes and uploads new ones. */
export function useChatAttachments(chatId: string, enabled: boolean) {
  const [loaded, setLoaded] = useState<{
    chatId: string;
    attachments: Attachment[];
  }>({ chatId, attachments: [] });
  const [uploading, setUploading] = useState(false);
  const [problems, setProblems] = useState<{
    chatId: string;
    messages: string[];
  }>({ chatId, messages: [] });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchAttachments(chatId)
      .then((attachments) => {
        if (!cancelled) setLoaded({ chatId, attachments });
      })
      .catch((error) => console.error("Failed to load attachments", error));
    return () => {
      cancelled = true;
    };
  }, [chatId, enabled]);

  async function attach(files: File[]) {
    setUploading(true);
    setProblems({ chatId, messages: [] });
    const results = await Promise.allSettled(
      files.map((file) => uploadAttachment(file, chatId)),
    );
    const added: Attachment[] = [];
    const failed: string[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") added.push(result.value);
      else if (result.reason instanceof AttachmentUploadError)
        failed.push(result.reason.message);
      else failed.push("Não foi possível enviar o arquivo.");
    }
    setLoaded((current) =>
      current.chatId === chatId
        ? { chatId, attachments: [...current.attachments, ...added] }
        : current,
    );
    setProblems({ chatId, messages: failed });
    setUploading(false);
  }

  return {
    attachments: loaded.chatId === chatId ? loaded.attachments : [],
    uploading,
    problems: problems.chatId === chatId ? problems.messages : [],
    attach,
  };
}
