import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- str_replace_editor label mapping ---

test("str_replace_editor create shows Creating label", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "/src/Button.tsx" }} state="call" />);
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("str_replace_editor str_replace shows Editing label", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "str_replace", path: "/src/Button.tsx" }} state="call" />);
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("str_replace_editor insert shows Editing label", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "insert", path: "/src/Button.tsx" }} state="call" />);
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("str_replace_editor view shows Reading label", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "view", path: "/src/Button.tsx" }} state="call" />);
  expect(screen.getByText("Reading Button.tsx")).toBeDefined();
});

test("str_replace_editor undo_edit shows Undoing edit label", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "undo_edit", path: "/src/Button.tsx" }} state="call" />);
  expect(screen.getByText("Undoing edit in Button.tsx")).toBeDefined();
});

test("str_replace_editor extracts basename from deep path", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "/a/b/c/Card.tsx" }} state="call" />);
  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
});

// --- file_manager label mapping ---

test("file_manager delete shows Deleting label", () => {
  render(<ToolCallBadge toolName="file_manager" args={{ command: "delete", path: "/src/config.json" }} state="call" />);
  expect(screen.getByText("Deleting config.json")).toBeDefined();
});

test("file_manager rename shows Renaming label", () => {
  render(<ToolCallBadge toolName="file_manager" args={{ command: "rename", path: "/src/config.json" }} state="call" />);
  expect(screen.getByText("Renaming config.json")).toBeDefined();
});

// --- state rendering ---

test("state call shows spinner and no green dot", () => {
  const { container } = render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "/src/App.tsx" }} state="call" />);
  expect(container.querySelector(".animate-spin")).toBeTruthy();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("state partial-call shows spinner and no green dot", () => {
  const { container } = render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "/src/App.tsx" }} state="partial-call" />);
  expect(container.querySelector(".animate-spin")).toBeTruthy();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("state result with truthy result shows green dot and no spinner", () => {
  const { container } = render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "/src/App.tsx" }} state="result" result="Success" />);
  expect(container.querySelector(".bg-emerald-500")).toBeTruthy();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

// --- edge cases ---

test("missing path arg falls back to 'file' in label", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create" }} state="call" />);
  expect(screen.getByText("Creating file")).toBeDefined();
});

test("unknown toolName falls back to raw tool name", () => {
  render(<ToolCallBadge toolName="some_future_tool" args={{}} state="call" />);
  expect(screen.getByText("some_future_tool")).toBeDefined();
});

test("known tool with unknown command falls back to raw tool name", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "unknown_cmd", path: "/src/App.tsx" }} state="call" />);
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});
