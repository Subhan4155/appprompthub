import { NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/adminRoute";
import { buildPromptUpdate, ValidationError } from "@/lib/adminValidation";
import { PromptRow, rowToPrompt } from "@/lib/mappers";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminClient();
  if ("response" in guard) return guard.response;
  const { admin } = guard;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  let upd: Record<string, unknown>;
  try {
    upd = buildPromptUpdate(body);
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }

  const { data, error } = await admin
    .from("prompts")
    .update(upd)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") return NextResponse.json({ error: "Prompt not found." }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ prompt: rowToPrompt(data as PromptRow) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminClient();
  if ("response" in guard) return guard.response;
  const { admin } = guard;
  const { id } = await params;

  const { error } = await admin.from("prompts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
