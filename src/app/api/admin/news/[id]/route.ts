import { NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/adminRoute";
import { buildNewsUpdate, ValidationError } from "@/lib/adminValidation";
import { NewsRow, rowToNews } from "@/lib/mappers";

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
    upd = buildNewsUpdate(body);
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }

  if (guard.isMock) {
    const mockedNews = {
      id,
      slug: upd.slug as string || "mock-slug",
      title: upd.title as string || "Mock Title",
      category: upd.category as any || "Model Release",
      summary: upd.summary as string || "",
      content: upd.content as string || "",
      importance: upd.importance as any || "high",
      source_url: upd.source_url as string || "",
      date: new Date().toISOString().slice(0, 10),
    };
    return NextResponse.json({ news: rowToNews(mockedNews as any) });
  }

  const { data, error } = await guard.admin
    .from("news")
    .update(upd)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") return NextResponse.json({ error: "News item not found." }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ news: rowToNews(data as NewsRow) });
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

  const { error } = await guard.admin.from("news").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
