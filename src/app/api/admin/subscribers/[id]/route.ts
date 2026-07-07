import { NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/adminRoute";

export const runtime = "nodejs";

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

  const { error } = await guard.admin.from("subscribers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
