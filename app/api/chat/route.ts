import { mastra } from "@/mastra";
import { toAISdkStream } from "@mastra/ai-sdk";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const agent = mastra.getAgent("humanInTheLoopAgent");

  const stream = await agent.stream(convertToModelMessages(messages), {
    maxSteps: 10,
    modelSettings: {},
    onError: ({ error }: { error: any }) => {
      console.error("Mastra stream onError", error);
    },
  });

  const lastMessage = messages[messages.length - 1];
  const lastMessageId =
    lastMessage?.role === "assistant" ? lastMessage.id : undefined;

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: ({ writer }) => {
        writer.merge(
          toAISdkStream(stream, {
            from: "agent",
            lastMessageId,
          }),
        );
      },
    }),
  });
}
