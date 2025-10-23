import { makeAssistantToolUI } from "@assistant-ui/react";
import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLatestTodos } from "@/hooks/use-latest-todos";
import { CheckCircle2, Circle, Clock, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Todo {
  text: string;
  status: "new" | "pending" | "in-progress" | "done";
}

interface AskForPlanApprovalArgs {
  explainer: string;
}

interface AskForPlanApprovalResult {
  todos: Todo[];
  approved: boolean;
}

const statusConfig = {
  new: {
    icon: Circle,
    color: "text-purple-600",
  },
  pending: {
    icon: Circle,
    color: "text-gray-500",
  },
  "in-progress": {
    icon: Clock,
    color: "text-blue-600",
  },
  done: {
    icon: CheckCircle2,
    color: "text-green-600",
  },
};

export const AskForPlanApprovalToolUI = makeAssistantToolUI<
  AskForPlanApprovalArgs,
  AskForPlanApprovalResult
>({
  toolName: "askForPlanApprovalTool",
  render: function Render({ status, result, addResult }) {
    const latestTodos = useLatestTodos();
    const isCompleted = status.type === "complete";
    const isRunning = status.type === "running";
    const isApproved = result?.approved;
    const isToolRejected =
      status.type === "incomplete" || (isCompleted && isApproved === false);

    // Filter out done tasks and reset all others to pending
    const initialTodos = latestTodos
      .filter((todo) => todo.status !== "done")
      .map((todo) => ({ ...todo, status: "pending" as const }));

    const [todos, setTodos] = useState<Todo[]>(initialTodos);
    const [draftValue, setDraftValue] = useState("");
    const itemRefs = useRef<Array<HTMLInputElement | null>>([]);
    const [pendingFocusIndex, setPendingFocusIndex] = useState<number | null>(
      null,
    );

    useEffect(() => {
      itemRefs.current = itemRefs.current.slice(0, todos.length);
    }, [todos.length]);

    useEffect(() => {
      if (pendingFocusIndex === null) return;

      const target = itemRefs.current[pendingFocusIndex];
      if (target) {
        target.focus();
        const length = target.value.length;
        target.setSelectionRange(length, length);
      }
      setPendingFocusIndex(null);
    }, [pendingFocusIndex, todos.length]);

    const handleTodoChange = useCallback((index: number, value: string) => {
      setTodos((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], text: value };
        return next;
      });
    }, []);

    const handleDelete = useCallback((index: number) => {
      setTodos((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleCreateFromDraft = useCallback((value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        setDraftValue(value);
        return;
      }

      setDraftValue("");
      setTodos((prev) => {
        const next = [...prev, { text: value, status: "pending" as const }];
        setPendingFocusIndex(next.length - 1);
        return next;
      });
    }, []);

    const handleApprove = useCallback(() => {
      addResult({
        todos,
        approved: true,
      });
    }, [todos, addResult]);

    const handleReject = useCallback(() => {
      addResult({
        todos: [],
        approved: false,
      });
    }, [addResult]);

    const headerStatus = isCompleted
      ? {
          icon: isApproved ? CheckCircle2 : AlertCircle,
          label: isApproved ? "Plan Approved" : "Plan Rejected",
          className: isApproved ? "text-emerald-600" : "text-red-600",
        }
      : null;

    return (
      <div
        className={cn(
          "my-3 overflow-hidden rounded-lg border bg-white shadow-sm",
          isToolRejected ? "border-red-400" : "border-slate-200",
        )}
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
          Plan Approval
          {headerStatus && (
            <span
              className={cn(
                "ml-auto flex items-center gap-1 text-xs font-semibold",
                headerStatus.className,
              )}
            >
              <headerStatus.icon className="h-4 w-4" aria-hidden />
              {headerStatus.label}
            </span>
          )}
        </div>

        <div className="px-4 py-3">
          {isCompleted ? (
            isApproved ? (
              todos.length > 0 ? (
                <ul className="flex flex-col gap-1">
                  {todos.map((todo, index) => {
                    const StatusIcon = statusConfig[todo.status].icon;

                    return (
                      <li
                        key={`approved-todo-${index}`}
                        className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-700"
                      >
                        <StatusIcon
                          className={cn(
                            "h-3.5 w-3.5 flex-shrink-0",
                            statusConfig[todo.status].color,
                          )}
                        />
                        <span className="text-sm text-slate-700">
                          {todo.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">
                  Approved with no tasks in the queue.
                </p>
              )
            ) : (
              <p className="text-sm text-slate-600">
                Plan rejected. The assistant will revise next steps.
              </p>
            )
          ) : (
            <>
              <ul className="flex flex-col">
                {todos.map((todo, index) => {
                  const StatusIcon = statusConfig[todo.status].icon;

                  return (
                    <li
                      key={`todo-${index}`}
                      className="group flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <StatusIcon
                        className={cn(
                          "h-3.5 w-3.5 flex-shrink-0",
                          statusConfig[todo.status].color,
                        )}
                      />
                      <input
                        ref={(el) => {
                          itemRefs.current[index] = el;
                        }}
                        value={todo.text}
                        onChange={(event) =>
                          handleTodoChange(index, event.target.value)
                        }
                        className="flex-1 bg-transparent text-sm text-slate-700 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleDelete(index)}
                        className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                        aria-label="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-slate-300 hover:text-slate-500" />
                      </button>
                    </li>
                  );
                })}

                <li className="flex items-center gap-2 px-2 py-1 text-sm text-slate-400">
                  <Circle className="h-3.5 w-3.5" />
                  <input
                    value={draftValue}
                    onChange={(event) =>
                      handleCreateFromDraft(event.target.value)
                    }
                    placeholder="<add new>"
                    className="flex-1 bg-transparent text-sm text-slate-400 outline-none placeholder:text-slate-300"
                  />
                </li>
              </ul>

              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReject}
                  disabled={isCompleted || isRunning}
                  className="h-8 px-3 text-sm"
                >
                  Reject Plan
                </Button>
                <Button
                  type="button"
                  onClick={handleApprove}
                  disabled={isCompleted || isRunning || todos.length === 0}
                  className="h-8 px-3 text-sm"
                >
                  Approve & Continue
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  },
});
