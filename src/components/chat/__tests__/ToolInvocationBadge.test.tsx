import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, getLabel } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

test("getLabel returns 'Creating' for str_replace_editor create command", () => {
  expect(getLabel("str_replace_editor", { command: "create", path: "src/App.tsx" })).toBe(
    "Creating App.tsx"
  );
});

test("getLabel returns 'Editing' for str_replace_editor str_replace command", () => {
  expect(getLabel("str_replace_editor", { command: "str_replace", path: "src/App.tsx" })).toBe(
    "Editing App.tsx"
  );
});

test("getLabel returns 'Editing' for str_replace_editor insert command", () => {
  expect(getLabel("str_replace_editor", { command: "insert", path: "src/components/Button.tsx" })).toBe(
    "Editing Button.tsx"
  );
});

test("getLabel returns 'Reading' for str_replace_editor view command", () => {
  expect(getLabel("str_replace_editor", { command: "view", path: "src/index.ts" })).toBe(
    "Reading index.ts"
  );
});

test("getLabel returns 'Undoing edit' for str_replace_editor undo_edit command", () => {
  expect(getLabel("str_replace_editor", { command: "undo_edit", path: "src/App.tsx" })).toBe(
    "Undoing edit to App.tsx"
  );
});

test("getLabel returns 'Renaming' for file_manager rename command", () => {
  expect(
    getLabel("file_manager", { command: "rename", path: "src/Old.tsx", new_path: "src/New.tsx" })
  ).toBe("Renaming Old.tsx to New.tsx");
});

test("getLabel returns 'Deleting' for file_manager delete command", () => {
  expect(getLabel("file_manager", { command: "delete", path: "src/Old.tsx" })).toBe(
    "Deleting Old.tsx"
  );
});

test("getLabel falls back to tool name for unknown tools", () => {
  expect(getLabel("some_other_tool", { command: "foo", path: "bar" })).toBe("some_other_tool");
});

test("renders label with spinner when not done", () => {
  render(
    <ToolInvocationBadge
      tool={{ toolName: "str_replace_editor", state: "call", args: { command: "create", path: "src/App.tsx" } }}
    />
  );
  expect(screen.getByText("Creating App.tsx")).toBeDefined();
});

test("renders label with green dot when done", () => {
  render(
    <ToolInvocationBadge
      tool={{
        toolName: "str_replace_editor",
        state: "result",
        result: "ok",
        args: { command: "str_replace", path: "src/App.tsx" },
      }}
    />
  );
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});
