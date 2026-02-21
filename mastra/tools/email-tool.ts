import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Check if Resend API key is configured
const hasResendKey = () => {
  return !!process.env.RESEND_API_KEY;
};

const getResendClient = async () => {
  const { Resend } = await import("resend");
  return new Resend(process.env.RESEND_API_KEY);
};

const proposedEmailSchema = z.object({
  emailHandle: z.string(),
  to: z.string(),
  subject: z.string(),
  body: z.string(),
});

type ToolResultContent = {
  type?: string;
  toolName?: string;
  output?: { value?: unknown } | Record<string, unknown>;
  [key: string]: unknown;
};

type ModelMessage = {
  content?: ToolResultContent[];
  [key: string]: unknown;
};

const findProposedEmail = (
  messages: ModelMessage[] | undefined,
  handle: string,
) => {
  if (!messages) return undefined;

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const contents = Array.isArray(message.content)
      ? (message.content as ToolResultContent[])
      : [];

    for (const content of contents) {
      if (
        content?.type === "tool-result" &&
        (content.toolName === "propose-email" ||
          content.toolName === "proposeEmailTool") &&
        content.output &&
        typeof content.output === "object"
      ) {
        const output = content.output as { value?: unknown };
        if (!("value" in output) || output.value === undefined) {
          continue;
        }

        try {
          const parsed = proposedEmailSchema.parse(output.value);
          if (parsed.emailHandle === handle) {
            return parsed;
          }
        } catch {
          // Ignore parse failures and keep searching
        }
      }
    }
  }

  return undefined;
};

const toHtml = (body: string) => {
  const escape = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  return escape(body).replace(/\n/g, "<br />");
};

export const sendEmailTool = createTool({
  id: "send-email",
  description:
    "Execute the delivery of a previously approved message or communication using the handle provided by the approval tool.",
  inputSchema: z.object({
    emailHandle: z
      .string()
      .describe(
        "Handle received from the propose-email tool after the user approves the draft",
      ),
  }),
  outputSchema: z.object({
    response: z.string(),
  }),
  execute: async ({ emailHandle }, context) => {
    // Check if Resend API key is configured
    if (!hasResendKey()) {
      throw new Error(
        "Email sending is not configured. Please inform the user that they need to add a RESEND_API_KEY to their .env file to enable email functionality. They can get an API key at https://resend.com/api-keys"
      );
    }

    const messages = context?.agent?.messages;
    const proposedEmail = findProposedEmail(messages as ModelMessage[] | undefined, emailHandle);

    if (!proposedEmail) {
      throw new Error(
        "Invalid or expired email handle. Please propose the email again and request user approval before sending.",
      );
    }

    const { to, subject, body } = proposedEmail;

    const resend = await getResendClient();
    await resend.emails.send({
      from: "Assistant UI <onboarding@resend.dev>",
      to: [to],
      subject: subject || "Welcome to Assistant UI",
      text: body,
      html: toHtml(body),
    });

    return {
      response: "Email sent successfully",
    };
  },
});
