import { mastra } from "@/mastra";
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
    format: "aisdk",
    maxSteps: 10,
    modelSettings: {},
    onError: ({ error }: { error: any }) => {
      console.error("Mastra streamVNext onError", error);
    },
  });
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: ({ writer }) => {
        writer.merge(
          stream.toUIMessageStream().pipeThrough(
            new TransformStream({
              transform(chunk, controller) {
                if (
                  chunk.type === "start" &&
                  messages[messages.length - 1].role === "assistant"
                ) {
                  controller.enqueue({
                    ...chunk,
                    messageId: messages[messages.length - 1].id,
                  });
                } else {
                  controller.enqueue(chunk);
                }
              },
            }),
          ),
        );
      },
    }),
  });
}
