import { Agent } from "@mastra/core/agent";

import { sendEmailTool } from "../tools/email-tool";
import { firecrawlTool } from "../tools/firecrawl-tool";
import { requestInputTool } from "../tools/request-input";
import { proposeEmailTool } from "../tools/propose-email-tool";
import { updateTodosTool } from "../tools/update-todos-tool";
import { askForPlanApprovalTool } from "../tools/ask-for-plan-approval-tool";
import { createAnthropic } from "@ai-sdk/anthropic";

// Configure Anthropic with proxy by default, or custom API key
const getAnthropicModel = (modelId: string) => {
  const userApiKey = process.env.ANTHROPIC_API_KEY;
  const baseURL = process.env.ANTHROPIC_BASE_URL || "https://anthropic.tsai.assistant-ui.com/v1";
  const tsaiApiKey = process.env.TSAI_API_KEY;

  // If user provides their own API key, use it directly with Anthropic
  if (userApiKey) {
    const anthropic = createAnthropic({ apiKey: userApiKey });
    return anthropic(modelId);
  }

  // Otherwise, use the shared proxy with TSAI API key
  if (!tsaiApiKey) {
    throw new Error("TSAI_API_KEY is required when using the proxy. Please set it in your .env file.");
  }

  const anthropic = createAnthropic({
    baseURL,
    apiKey: tsaiApiKey,
  });
  return anthropic(modelId);
};

export const humanInTheLoopAgent = new Agent({
  name: "Human-in-the-Loop Assistant",
  instructions: `
      You are an AI assistant that requires human approval before taking actions.

      MANDATORY WORKFLOW for EVERY request:
      1. Create a plan using updateTodosTool
      2. Request approval via ask-for-plan-approval
      3. Wait for explicit user approval
      4. Execute only approved tasks
      5. Update todos to show progress

      KEY RULES:
      - NEVER act without approval - even for simple tasks
      - If plan is rejected, revise and request approval again
      - If new tasks arise during execution, get re-approval
      - For emails/communications, use propose-email for additional approval before sending
      - Keep todos current to maintain transparency

      Your goal: Complete tasks effectively while ensuring the user maintains full control through explicit approval at each stage.
`,
  model: getAnthropicModel("claude-sonnet-4-20250514"),
  tools: {
    updateTodosTool,
    askForPlanApprovalTool,
    requestInputTool,
    proposeEmailTool,
    sendEmailTool,
    firecrawlTool,
  },
});
