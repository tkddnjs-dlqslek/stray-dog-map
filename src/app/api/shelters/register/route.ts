import { NextRequest, NextResponse } from "next/server";
import { addRegistered, getShelter, isRegisteredId } from "@/lib/store";
import { isRegion, regionJitter } from "@/lib/regions";
import type { Shelter } from "@/lib/types";

function slugify(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// 실제 사설보호소가 직접 등록(자기등록)하는 엔드포인트 — 데이터 수집의 정식 경로.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const region = body.region;
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!name || !address || !isRegion(region)) {
    return NextResponse.json(
      { error: "보호소명, 지역, 주소는 필수입니다." },
      { status: 400 }
    );
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "올바른 이메일 주소를 입력해주세요." }, { status: 400 });
  }

  const id = `reg-${slugify(name + address)}`;
  if (isRegisteredId(id) || (await getShelter(id))) {
    return NextResponse.json({ error: "이미 등록(또는 신청)된 보호소입니다." }, { status: 409 });
  }

  // 좌표 미입력 시 시/도 중심 + 이름 기반 배치 (지오코딩은 운영 단계에서 교체)
  const hasCoord = typeof body.lat === "number" && typeof body.lng === "number";
  const [lat, lng] = hasCoord ? [body.lat, body.lng] : regionJitter(name, region);

  const shelter: Shelter = {
    id,
    name,
    kind: "private",
    region,
    lat,
    lng,
    address,
    phone: phone || undefined,
    description: description || `${region} 지역 사설보호소입니다. 봉사 타임테이블은 운영자 콘솔에서 등록됩니다.`,
    applyMethod: "self",
    slots: [],
    notify: email ? { email } : undefined,
    source: "community",
    status: "pending",
    registeredAt: new Date().toISOString(),
  };

  addRegistered(shelter);
  return NextResponse.json({ ok: true, shelter }, { status: 201 });
}
