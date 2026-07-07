import { NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/adminRoute";
import { buildPromptInsert, ValidationError } from "@/lib/adminValidation";
import { PromptRow, rowToPrompt } from "@/lib/mappers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const guard = await requireAdminClient();
  if ("response" in guard) return guard.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  let row: ReturnType<typeof buildPromptInsert>;
  try {
    row = buildPromptInsert(body);
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }

  if (guard.isMock) {
    return NextResponse.json({ prompt: rowToPrompt(row as any) }, { status: 201 });
  }

  const { data, error } = await guard.admin.from("prompts").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ prompt: rowToPrompt(data as PromptRow) }, { status: 201 });
}
