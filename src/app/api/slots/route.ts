import { NextRequest, NextResponse } from "next/server";
import { getShelter, setSlots } from "@/lib/store";
import type { TimeSlot } from "@/lib/types";

function validSlot(s: unknown): s is TimeSlot {
  if (typeof s !== "object" || s === null) return false;
  const o = s as Record<string, unknown>;
  const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
  return (
    typeof o.weekday === "number" &&
    o.weekday >= 0 &&
    o.weekday <= 6 &&
    typeof o.start === "string" &&
    timeRe.test(o.start) &&
    typeof o.end === "string" &&
    timeRe.test(o.end) &&
    o.start < o.end &&
    typeof o.capacity === "number" &&
    o.capacity >= 1 &&
    o.capacity <= 30 &&
    typeof o.label === "string" &&
    o.label.trim().length > 0
  );
}

// 사설보호소 운영자가 봉사 타임슬롯을 저장(전체 교체)한다.
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.shelterId !== "string" || !Array.isArray(body.slots)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const shelter = await getShelter(body.shelterId);
  if (!shelter) {
    return NextResponse.json({ error: "존재하지 않는 보호소입니다." }, { status: 404 });
  }
  if (shelter.applyMethod !== "self") {
    return NextResponse.json(
      { error: "1365 연결 보호소는 자체 슬롯을 등록할 수 없습니다." },
      { status: 400 }
    );
  }

  if (!body.slots.every(validSlot)) {
    return NextResponse.json(
      { error: "시간대 정보가 올바르지 않습니다. (요일/시간/정원 확인)" },
      { status: 400 }
    );
  }

  // 슬롯 id 부여(없으면 생성)
  const slots: TimeSlot[] = (body.slots as TimeSlot[]).map((s, i) => ({
    ...s,
    id: s.id && String(s.id).trim() ? s.id : `slot_${Date.now()}_${i}`,
    label: s.label.trim(),
  }));

  await setSlots(body.shelterId, slots);
  return NextResponse.json({ ok: true, slots });
}
