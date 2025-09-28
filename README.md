# Human-in-the-Loop AI Assistant

AI agent that asks for your approval at every step. Built with [assistant-ui](https://github.com/Yonom/assistant-ui) and [Mastra](https://mastra.dev).

## Features

✅ **Plan Approval** - Review and edit AI's todo list before execution
✅ **Input Requests** - Interactive forms when info is needed
✅ **Email Preview** - Approve drafts before sending
✅ **Never Acts Alone** - Every action requires explicit approval

## Demo

[Watch the demo](https://github.com/user-attachments/assets/8c19f83a-b29f-4631-9bfc-556c99a3355d)

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env.local
npm run dev
```

Visit http://localhost:3000

## How It Works

1. **AI plans** → Shows editable todo list
2. **You approve** → Edit tasks or reject plan
3. **AI executes** → Requests input or shows drafts as needed
4. **You control** → Approve/reject at each step

## Architecture

```
components/tools/          # Approval UI components
├── human-in-the-loop.tsx # Email draft & input UI
└── plan-approval.tsx     # Todo list approval UI

mastra/                   # Agent backend
├── agents/               # AI agent with approval rules
└── tools/                # Tool definitions (6 tools)

app/api/chat/             # Chat endpoint
```

## Key Files

### Agent Rules (`mastra/agents/email-marketing-agent.ts`)
```typescript
instructions: `
  - Plan approach with updateTodosTool
  - Ask approval via askForPlanApprovalTool
  - Only proceed after approval
`
```

### Approval UI (`components/tools/plan-approval.tsx`)
```tsx
<AskForPlanApprovalToolUI>
  // Shows editable todo list
  // Returns: { todos, approved }
</AskForPlanApprovalToolUI>
```

## Customization

### Add New Tool

1. Create tool in `mastra/tools/`
2. Create UI in `components/tools/`
3. Register in `app/assistant.tsx`

### Modify Behavior

Edit agent instructions in `mastra/agents/email-marketing-agent.ts`

## Environment Variables

```bash
# Required (choose one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional
RESEND_API_KEY=re_...        # Email sending
FIRECRAWL_API_KEY=fc_...     # Web scraping
```

## License

MIT
