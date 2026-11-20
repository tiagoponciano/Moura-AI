"use client";

import { Chat } from "@/components/chat/chat";

/** Questions about the CBMSC instructions, answered from their text with the article cited. */
export function NormsChat() {
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col p-4">
      <Chat
        endpoint="/api/norms/chat"
        placeholder="Ex.: o que a IN 9 diz sobre escada enclausurada?"
        emptyState="Pergunte o que uma instrução normativa do CBMSC diz. A resposta vem do texto da norma, com a instrução e o artigo."
      />
    </div>
  );
}
