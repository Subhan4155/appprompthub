import { NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/adminRoute";
import { buildNewsInsert, ValidationError } from "@/lib/adminValidation";
import { NewsRow, rowToNews } from "@/lib/mappers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const guard = await requireAdminClient();
  if ("response" in guard) return guard.response;
  const { admin } = guard;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  let row: ReturnType<typeof buildNewsInsert>;
  try {
    row = buildNewsInsert(body);
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }

  const { data, error } = await admin.from("news").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ news: rowToNews(data as NewsRow) }, { status: 201 });
}
