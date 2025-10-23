# Human-in-the-Loop AI Assistant

An AI agent system with mandatory approval gates at every execution step. Implements a three-phase workflow: planning, approval, and execution with explicit human control points.

Built with [assistant-ui](https://github.com/Yonom/assistant-ui) for UI components and [Mastra](https://mastra.dev) for agent orchestration.

## Why assistant-ui?

If you're building Mastra agents, assistant-ui provides the production-ready UI layer you need. While Mastra handles agent orchestration and tool execution, assistant-ui solves the frontend challenges:

**Streaming UI Components** - Render tool calls and results in real-time as the agent executes. Each tool gets a custom UI component that updates during execution, not after.

**Type-Safe Tool UIs** - Define tool-specific interfaces with `makeAssistantToolUI()`. The approval workflow in this example shows complex multi-step UI (plan editor → approval gate → execution tracker) built with full TypeScript safety.

**Message Threading** - Built-in support for conversation history, message state management, and runtime switching. No need to wire up React state or handle streaming yourself.

**Framework Agnostic** - Works with any LLM provider (Anthropic, OpenAI, etc.) and any agent framework. This example uses Mastra + Claude, but you can swap in different backends without changing UI code.

**What This Example Showcases:**
- Custom tool UIs for plan approval, todo tracking, and human input collection
- Real-time streaming updates across multiple tool executions
- Complex approval workflows with editable plans before execution
- Integration pattern between Mastra's tool system and React components

## Use Case

Standard AI agents execute actions autonomously, which can lead to unwanted outcomes (sending emails, making API calls, modifying data). This template enforces human oversight by:

1. Requiring plan approval before any action execution
2. Showing drafts/previews for high-stakes operations (emails, API calls)
3. Requesting human input when information is missing
4. Maintaining full execution transparency through real-time todo tracking

Suitable for scenarios where AI assistance is valuable but autonomy is unacceptable: customer communications, data operations, financial transactions.

## Setup

```bash
npm install
npm run dev
```

Access at `http://localhost:3000`

The `.env` file is pre-configured with your TSAI_API_KEY for accessing the shared Anthropic and Firecrawl proxies.

## Architecture

### Components

```
components/tools/          # Tool-specific UI implementations
├── plan-approval.tsx      # Todo list editor with approve/reject
├── human-in-the-loop.tsx  # Email draft preview & input forms
└── todo.tsx               # Real-time todo list display

mastra/
├── agents/
│   └── human-in-the-loop-agent.ts  # Agent with approval rules
└── tools/
    ├── ask-for-plan-approval-tool.ts   # Plan submission
    ├── update-todos-tool.ts            # Todo list management
    ├── request-input-tool.ts           # Human input requests
    ├── propose-email-tool.ts           # Email draft preview
    ├── send-email-tool.ts              # Email execution
    └── firecrawl-tool.ts              # Web scraping
```

### Workflow

```
User Request
     ↓
Agent analyzes → Creates todo list → updateTodosTool()
     ↓
Shows plan UI → askForPlanApprovalTool()
     ↓
User approves/rejects/edits
     ↓
If approved → Execute tasks sequentially
     ↓
For each task:
  - Need input? → requestInputTool()
  - Send email? → proposeEmailTool() → (approval) → sendEmailTool()
  - Web scrape? → firecrawlTool()
     ↓
Update todos in real-time
```

## Tools

### 1. Plan Management
**`updateTodosTool`** - Creates/updates todo list
- Input: Array of `{content, status, activeForm}`
- Status: `pending | in_progress | completed`
- UI updates in real-time via `components/tools/todo.tsx`

**`askForPlanApprovalTool`** - Submits plan for approval
- Blocks execution until user approves/rejects
- Returns: `{todos[], approved: boolean}`
- UI: `components/tools/plan-approval.tsx`

### 2. Human Input
**`requestInputTool`** - Requests information from user
- Input: `{label, placeholder}`
- Blocks until user provides input
- Returns: `{result: string}`
- UI: `components/tools/human-in-the-loop.tsx`

### 3. Email Operations
**`proposeEmailTool`** - Shows email draft for approval
- Input: `{to, subject, body}`
- Generates unique handle for tracking
- Returns: `{emailHandle, approved: boolean}`

**`sendEmailTool`** - Executes approved email
- Input: `{emailHandle}`
- Validates handle exists in message history
- Requires: `RESEND_API_KEY` in environment

### 4. Web Scraping
**`firecrawlTool`** - Extracts content from websites
- Input: `{url}`
- Returns: `{content: markdown}`
- Rate limited: 20 requests/day per IP (shared proxy)
- Unlimited with `FIRECRAWL_API_KEY`

## API Access

### Shared Proxies (Pre-configured)
The USB deployment includes pre-configured access to rate-limited proxies:

- **Anthropic**: 120 requests/day per IP
- **Firecrawl**: 20 requests/day per IP
- **Email**: Requires `RESEND_API_KEY`

Authentication via `TSAI_API_KEY` (pre-generated on USB).

### Bring Your Own Keys
For unlimited access, add to `.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-...  # Direct Anthropic API access
FIRECRAWL_API_KEY=fc-...      # Direct Firecrawl API access
RESEND_API_KEY=re-...         # Required for email functionality
```

When API keys are provided, the app bypasses proxies and connects directly to services.

## Agent Configuration

Agent instructions in `mastra/agents/human-in-the-loop-agent.ts`:

```typescript
instructions: `
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
  - For emails, use propose-email for additional approval
  - Keep todos current to maintain transparency
`
```

The agent uses Claude Sonnet 4 via either:
1. Shared proxy (`https://anthropic.tsai.assistant-ui.com/v1`) with `TSAI_API_KEY`
2. Direct Anthropic API with `ANTHROPIC_API_KEY`

## Extending

### Adding a New Tool

1. **Create tool** (`mastra/tools/your-tool.ts`):
```typescript
export const yourTool = createTool({
  id: "your-tool",
  description: "What the tool does",
  inputSchema: z.object({...}),
  execute: async ({ context }) => {...}
});
```

2. **Create UI** (`components/tools/your-tool.tsx`):
```typescript
export const YourToolUI = makeAssistantToolUI({
  toolName: "yourTool",
  render: ({ args, result, status, addResult }) => {...}
});
```

3. **Register**:
- Add tool to agent in `mastra/agents/human-in-the-loop-agent.ts`
- Add UI to `app/assistant.tsx`

### Modifying Approval Logic

Edit `components/tools/plan-approval.tsx` to change:
- Todo list editing behavior
- Approval/rejection handling
- UI presentation

## License

MIT