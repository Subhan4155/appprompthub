import crypto from "node:crypto";
import {
  PROMPT_CATEGORIES,
  DIFFICULTIES,
  NEWS_CATEGORIES,
  IMPORTANCES,
} from "./mappers";

// Server-side validation + snake_case row building for admin writes. Throwing a
// ValidationError lets route handlers turn any bad input into a clean 400.

export class ValidationError extends Error {}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Body = Record<string, unknown>;

function has(body: Body, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined;
}

function reqStr(body: Body, key: string, max = 20000): string {
  const v = body[key];
  if (typeof v !== "string" || v.trim() === "") {
    throw new ValidationError(`Field "${key}" is required.`);
  }
  const t = v.trim();
  if (t.length > max) throw new ValidationError(`Field "${key}" is too long.`);
  return t;
}

function optStr(body: Body, key: string, max = 20000): string | null {
  const v = body[key];
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string") throw new ValidationError(`Field "${key}" must be a string.`);
  const t = v.trim();
  if (t.length > max) throw new ValidationError(`Field "${key}" is too long.`);
  return t === "" ? null : t;
}

function enumStr(body: Body, key: string, allowed: readonly string[]): string {
  const v = reqStr(body, key, 120);
  if (!allowed.includes(v)) {
    throw new ValidationError(`Field "${key}" must be one of: ${allowed.join(", ")}.`);
  }
  return v;
}

function slugField(body: Body): string {
  const v = reqStr(body, "slug", 200);
  if (!SLUG_RE.test(v)) {
    throw new ValidationError(
      "Slug must be lowercase letters and numbers separated by single hyphens."
    );
  }
  return v;
}

function urlOrNull(body: Body, key: string): string | null {
  const v = optStr(body, key, 2000);
  if (v === null) return null;
  if (!/^https?:\/\//i.test(v)) {
    throw new ValidationError(`Field "${key}" must be a valid http(s) URL.`);
  }
  return v;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---- Prompts ----

export function buildPromptInsert(body: Body) {
  return {
    id: crypto.randomUUID(),
    slug: slugField(body),
    title: reqStr(body, "title", 300),
    description: optStr(body, "description", 2000) ?? "",
    category: enumStr(body, "category", PROMPT_CATEGORIES),
    target_ai: reqStr(body, "targetAI", 120),
    prompt_text: reqStr(body, "promptText"),
    output_description: optStr(body, "outputDescription", 2000) ?? "",
    views: 0,
    likes: 0,
    difficulty: enumStr(body, "difficulty", DIFFICULTIES),
    date: today(),
  };
}

// Never includes id, views, likes, or date — editing must not clobber live
// counters or reassign identity.
export function buildPromptUpdate(body: Body): Record<string, unknown> {
  const upd: Record<string, unknown> = {};
  if (has(body, "slug")) upd.slug = slugField(body);
  if (has(body, "title")) upd.title = reqStr(body, "title", 300);
  if (has(body, "description")) upd.description = optStr(body, "description", 2000) ?? "";
  if (has(body, "category")) upd.category = enumStr(body, "category", PROMPT_CATEGORIES);
  if (has(body, "targetAI")) upd.target_ai = reqStr(body, "targetAI", 120);
  if (has(body, "promptText")) upd.prompt_text = reqStr(body, "promptText");
  if (has(body, "outputDescription")) {
    upd.output_description = optStr(body, "outputDescription", 2000) ?? "";
  }
  if (has(body, "difficulty")) upd.difficulty = enumStr(body, "difficulty", DIFFICULTIES);
  if (Object.keys(upd).length === 0) {
    throw new ValidationError("No editable fields provided.");
  }
  return upd;
}

// ---- News ----

export function buildNewsInsert(body: Body) {
  return {
    id: crypto.randomUUID(),
    slug: slugField(body),
    title: reqStr(body, "title", 300),
    category: enumStr(body, "category", NEWS_CATEGORIES),
    summary: reqStr(body, "summary", 2000),
    content: reqStr(body, "content"),
    importance: enumStr(body, "importance", IMPORTANCES),
    source_url: urlOrNull(body, "sourceUrl"),
    date: today(),
  };
}

export function buildNewsUpdate(body: Body): Record<string, unknown> {
  const upd: Record<string, unknown> = {};
  if (has(body, "slug")) upd.slug = slugField(body);
  if (has(body, "title")) upd.title = reqStr(body, "title", 300);
  if (has(body, "category")) upd.category = enumStr(body, "category", NEWS_CATEGORIES);
  if (has(body, "summary")) upd.summary = reqStr(body, "summary", 2000);
  if (has(body, "content")) upd.content = reqStr(body, "content");
  if (has(body, "importance")) upd.importance = enumStr(body, "importance", IMPORTANCES);
  if (has(body, "sourceUrl")) upd.source_url = urlOrNull(body, "sourceUrl");
  if (Object.keys(upd).length === 0) {
    throw new ValidationError("No editable fields provided.");
  }
  return upd;
}
