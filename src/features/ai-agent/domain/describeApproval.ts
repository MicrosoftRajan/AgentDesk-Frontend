import type { ApprovalRequestResponse } from "../../../services/api/agents";

/** "delete_document" -> "Delete document" */
export function humanize(identifier: string): string {
  const text = identifier.replace(/[_-]+/g, " ").trim();

  return text.length > 0
    ? text.charAt(0).toUpperCase() + text.slice(1)
    : identifier;
}

export interface ApprovalDetail {
  label: string;
  value: string;
}

function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value) ?? String(value);
}

/** Turns the raw tool input into label/value rows the user can read. */
export function approvalDetails(
  approval: Pick<ApprovalRequestResponse, "toolInput">,
): ApprovalDetail[] {
  const input = approval.toolInput;

  if (input && typeof input === "object" && !Array.isArray(input)) {
    return Object.entries(input).map(([key, value]) => ({
      label: humanize(key),
      value: formatValue(value),
    }));
  }

  return input === null || input === undefined
    ? []
    : [{ label: "Input", value: formatValue(input) }];
}

export function formatExpiry(expiresAt: string): string {
  const date = new Date(expiresAt);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
