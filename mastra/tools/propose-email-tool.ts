import { randomUUID } from "node:crypto";

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const outputSchema = z.object({
  emailHandle: z.string(),
  to: z.string(),
  subject: z.string(),
  body: z.string(),
});

export const proposeEmailTool = createTool({
  id: "propose-email",
  description:
    "Present a draft message or communication for user review and approval. Returns a handle that can be used to send the message after approval.",
  inputSchema: z.object({
    to: z.string().describe("Email address of the recipient"),
    subject: z.string().describe("Email subject shown to the recipient"),
    body: z.string().describe("Plaintext body of the email"),
  }),
  outputSchema,
  execute: async ({ to, subject, body }) => {
    const emailHandle = randomUUID();
    return { emailHandle, to, subject, body };
  },
});
