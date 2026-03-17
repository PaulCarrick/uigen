import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  state: string;
  result?: unknown;
  args: Record<string, unknown>;
}

interface ToolInvocationBadgeProps {
  tool: ToolInvocation;
}

function getLabel(toolName: string, args: Record<string, unknown>): string {
  const filename =
    typeof args.path === "string" ? args.path.split("/").pop() ?? args.path : "";

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return `Creating ${filename}`;
      case "str_replace":
      case "insert":
        return `Editing ${filename}`;
      case "view":
        return `Reading ${filename}`;
      case "undo_edit":
        return `Undoing edit to ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename": {
        const newFilename =
          typeof args.new_path === "string"
            ? args.new_path.split("/").pop() ?? args.new_path
            : "";
        return `Renaming ${filename} to ${newFilename}`;
      }
      case "delete":
        return `Deleting ${filename}`;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ tool }: ToolInvocationBadgeProps) {
  const isDone = tool.state === "result" && tool.result != null;
  const label = getLabel(tool.toolName, tool.args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}

export { getLabel };
