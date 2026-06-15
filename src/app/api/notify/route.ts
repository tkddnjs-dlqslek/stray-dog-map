import { NextRequest, NextResponse } from "next/server";
import { getShelter, setNotify } from "@/lib/store";

// 사설보호소 운영자가 예약 알림을 받을 웹훅 채널을 저장한다.
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.shelterId !== "string") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const shelter = await getShelter(body.shelterId);
  if (!shelter) {
    return NextResponse.json({ error: "존재하지 않는 보호소입니다." }, { status: 404 });
  }
  if (shelter.applyMethod !== "self") {
    return NextResponse.json(
      { error: "자체예약 보호소만 알림 채널을 설정할 수 있습니다." },
      { status: 400 }
    );
  }

  const webhook = typeof body.webhook === "string" ? body.webhook.trim() : "";
  if (webhook && !/^https?:\/\//.test(webhook)) {
    return NextResponse.json({ error: "올바른 웹훅 URL을 입력해주세요." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "올바른 이메일 주소를 입력해주세요." }, { status: 400 });
  }

  setNotify(body.shelterId, { webhook: webhook || undefined, email: email || undefined });
  return NextResponse.json({ ok: true, webhook: webhook || null, email: email || null });
}
