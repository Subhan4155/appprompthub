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

  if (guard.isMock) {
    const mockedPrompt = {
      id,
      slug: upd.slug as string || "mock-slug",
      title: upd.title as string || "Mock Title",
      description: upd.description as string || "",
      category: upd.category as any || "web-app",
      target_ai: upd.target_ai as string || "Claude 3.5 Sonnet",
      prompt_text: upd.prompt_text as string || "",
      output_description: upd.output_description as string || "",
      difficulty: upd.difficulty as any || "Intermediate",
      expected_output_image_url: upd.expected_output_image_url as string || "",
      views: 120,
      likes: 45,
      date: new Date().toISOString().slice(0, 10),
    };
    return NextResponse.json({ prompt: rowToPrompt(mockedPrompt as any) });
  }

  const { data, error } = await guard.admin
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
  const { id } = await params;

  if (guard.isMock) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await guard.admin.from("prompts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
