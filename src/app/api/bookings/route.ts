import { NextRequest, NextResponse } from "next/server";
import { bookedCount, getShelter, readBookings, writeBookings } from "@/lib/store";
import { notifyShelter } from "@/lib/notify";
import type { Booking } from "@/lib/types";

export function GET(req: NextRequest) {
  const shelterId = req.nextUrl.searchParams.get("shelterId");
  const date = req.nextUrl.searchParams.get("date");
  let bookings = readBookings();
  if (shelterId) bookings = bookings.filter((b) => b.shelterId === shelterId);
  if (date) bookings = bookings.filter((b) => b.date === date);
  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { shelterId, slotId, date, name, phone, people } = body as Partial<Booking>;

  if (!shelterId || !slotId || !date || !name || !phone || !people) {
    return NextResponse.json({ error: "모든 항목을 입력해주세요." }, { status: 400 });
  }

  const shelter = await getShelter(shelterId);
  if (!shelter) {
    return NextResponse.json({ error: "존재하지 않는 보호소입니다." }, { status: 404 });
  }
  if (shelter.applyMethod !== "self") {
    return NextResponse.json(
      { error: "이 보호소는 1365를 통해 신청해야 합니다." },
      { status: 400 }
    );
  }

  const slot = shelter.slots.find((s) => s.id === slotId);
  if (!slot) {
    return NextResponse.json({ error: "존재하지 않는 시간대입니다." }, { status: 404 });
  }

  // 선택한 날짜의 요일이 슬롯 요일과 일치하는지 검증
  const weekday = new Date(`${date}T00:00:00`).getDay();
  if (weekday !== slot.weekday) {
    return NextResponse.json(
      { error: "선택한 날짜와 봉사 요일이 맞지 않습니다." },
      { status: 400 }
    );
  }

  // 정원 검증
  const already = bookedCount(shelterId, slotId, date);
  const peopleNum = Number(people);
  if (already + peopleNum > slot.capacity) {
    return NextResponse.json(
      { error: `정원이 부족합니다. 남은 자리: ${slot.capacity - already}명` },
      { status: 409 }
    );
  }

  const booking: Booking = {
    id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    shelterId,
    slotId,
    date,
    name: String(name),
    phone: String(phone),
    people: peopleNum,
    createdAt: new Date().toISOString(),
  };

  const bookings = readBookings();
  bookings.push(booking);
  writeBookings(bookings);

  // 보호소에 알림 발송 (best-effort — 실패해도 예약은 확정)
  const notified = await notifyShelter(shelter, slot, booking);

  return NextResponse.json({ ...booking, notified }, { status: 201 });
}
