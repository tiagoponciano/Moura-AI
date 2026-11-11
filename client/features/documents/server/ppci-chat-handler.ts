import { convertToModelMessages, isStepCount, streamText, tool } from "ai";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import {
  consumeChatQuota,
  parseChatMessages,
  resolveChatModel,
  toChatResponse,
} from "@/lib/llm";
import { requireUser } from "@/lib/auth/require-user";
import {
  GROUP_NOT_APPLICABLE_TOOL,
  MARK_ITEMS_TOOL,
  markItemsInput,
  ppciChatBody,
  unansweredItems,
} from "../lib/ppci-agent";
import { answersByItem } from "../lib/ppci-answers";
import { buildPpciInstructions } from "./ppci-instructions";
import { loadChecklist } from "./ppci-handler";

/**
 * Streams the PPCI checklist agent for one group of a project. The server loads
 * the checklist and the answers itself and sends the model only that group's
 * unanswered items; the tools echo the answers back to the client, which saves
 * them.
 */
export async function handlePpciChat(req: Request): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const body = await parseJsonBody(req, ppciChatBody);
  if (body.error) return body.error;
  const messages = await parseChatMessages(body.data.messages);
  if (!messages) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }

  const loaded = await loadChecklist(session.supabase, body.data.projectId);
  if ("error" in loaded) return loaded.error;
  const { groups, answers } = loaded.checklist;
  const group = groups.find(
    (candidate) => candidate.position === body.data.groupPosition,
  );
  if (!group) {
    return Response.json({ error: "Group not found" }, { status: 404 });
  }
  const unanswered = unansweredItems(group, answersByItem(answers));

  const quotaError = await consumeChatQuota();
  if (quotaError) return quotaError;
  const { model, error } = await resolveChatModel();
  if (error) return error;

  const result = streamText({
    model,
    instructions: buildPpciInstructions(
      group,
      unanswered,
      group.items.length - unanswered.length,
    ),
    messages: await convertToModelMessages(messages),
    tools: {
      [MARK_ITEMS_TOOL]: tool({
        description:
          "Records the answers the user gave for items of the current group. Send only the items that were answered.",
        inputSchema: markItemsInput,
        execute: async (input) => input,
      }),
      [GROUP_NOT_APPLICABLE_TOOL]: tool({
        description:
          "Marks every unanswered item of the current group as not applicable, when the user says the whole group does not apply to the project.",
        inputSchema: z.object({}),
        execute: async () => ({}),
      }),
    },
    stopWhen: isStepCount(5),
  });

  return toChatResponse(result.stream);
}
