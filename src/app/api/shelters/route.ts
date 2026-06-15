import { NextResponse } from "next/server";
import { getShelters } from "@/lib/store";

// 슬롯 오버라이드·공공 API 결과가 항상 최신으로 반영되도록 캐시 비활성화
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getShelters());
}
