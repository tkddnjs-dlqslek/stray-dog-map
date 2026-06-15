import { NextRequest, NextResponse } from "next/server";
import { getPendingShelters, moderateShelter } from "@/lib/store";
import { isAdminAuthed } from "@/lib/admin";

export const dynamic = "force-dynamic";

// 검수 대기 목록 조회
export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  return NextResponse.json({ pending: await getPendingShelters() });
}

// 승인/거절 처리
export async function PUT(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const id = body?.id;
  const action = body?.action;
  if (typeof id !== "string" || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "id와 action(approve|reject)이 필요합니다." }, { status: 400 });
  }
  const result = await moderateShelter(id, action);
  if (!result) {
    return NextResponse.json({ error: "대상 보호소를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, id, status: result.status });
}
