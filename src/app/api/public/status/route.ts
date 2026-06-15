import { NextRequest, NextResponse } from "next/server";
import { fetchPublicSheltersDiagnostic } from "@/lib/animalApi";
import { isAdminAuthed } from "@/lib/admin";

export const dynamic = "force-dynamic";

// 공공 API 연동 상태 진단 (키 유무, 지역별 수집 수, 오류)
export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  return NextResponse.json(await fetchPublicSheltersDiagnostic());
}
