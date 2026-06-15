"use client";

import { useEffect, useMemo, useState } from "react";
import type { Booking, Shelter, TimeSlot } from "@/lib/types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 오늘부터 8주 안에서 해당 요일에 맞는 날짜들을 구함 */
function upcomingDates(weekday: number, weeks = 8): string[] {
  const out: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === weekday) {
      out.push(d.toISOString().slice(0, 10));
    }
  }
  return out;
}

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

export default function BookingPanel({ shelter }: { shelter: Shelter }) {
  const [selected, setSelected] = useState<TimeSlot | null>(null);
  const [date, setDate] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState(1);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // 선택한 날짜의 예약 현황을 불러와 정원 계산
  async function refreshBookings(d: string) {
    if (!d) return;
    const res = await fetch(`/api/bookings?shelterId=${shelter.id}&date=${d}`);
    setBookings(res.ok ? await res.json() : []);
  }

  useEffect(() => {
    if (date) refreshBookings(date);
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const dates = useMemo(
    () => (selected ? upcomingDates(selected.weekday) : []),
    [selected]
  );

  function bookedFor(slotId: string): number {
    return bookings
      .filter((b) => b.slotId === slotId)
      .reduce((sum, b) => sum + b.people, 0);
  }

  const remaining = selected ? selected.capacity - bookedFor(selected.id) : 0;

  async function submit() {
    if (!selected || !date) {
      setMsg({ type: "err", text: "시간대와 날짜를 선택해주세요." });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shelterId: shelter.id,
          slotId: selected.id,
          date,
          name,
          phone,
          people: Number(people),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: data.error ?? "신청에 실패했습니다." });
      } else {
        const notified = data.notified?.sent
          ? " 보호소에도 알림이 전송됐어요."
          : " (보호소 알림 채널이 아직 설정되지 않아 콘솔에서 확인합니다.)";
        setMsg({
          type: "ok",
          text: `신청 완료! ${fmtDate(date)} ${selected.start} 봉사에 ${people}명 예약됐어요.${notified}`,
        });
        setName("");
        setPhone("");
        setPeople(1);
        await refreshBookings(date);
      }
    } catch {
      setMsg({ type: "err", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 4 }}>봉사 시간대 선택</h2>
      <p className="muted">원하는 요일·시간대를 고르면 신청 가능한 날짜가 나와요.</p>

      <div className="slot-grid">
        {shelter.slots.map((slot) => {
          const isSel = selected?.id === slot.id;
          return (
            <div
              key={slot.id}
              className={`slot ${isSel ? "selected" : ""}`}
              onClick={() => {
                setSelected(slot);
                setDate("");
                setMsg(null);
              }}
            >
              <div className="day">
                {WEEKDAYS[slot.weekday]}요일 · {slot.label}
              </div>
              <div className="time">
                {slot.start} ~ {slot.end}
              </div>
              <div className="cap cap-ok">정원 {slot.capacity}명</div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="form-row">
            <label>봉사 날짜</label>
            <select value={date} onChange={(e) => setDate(e.target.value)}>
              <option value="">날짜를 선택하세요</option>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {fmtDate(d)}
                </option>
              ))}
            </select>
          </div>

          {date && (
            <div
              className={`cap ${
                remaining <= 0 ? "cap-full" : remaining <= 2 ? "cap-low" : "cap-ok"
              }`}
              style={{ marginBottom: 12 }}
            >
              {remaining <= 0
                ? "이 날짜는 마감됐어요 😢"
                : `남은 자리: ${remaining}명 / 정원 ${selected.capacity}명`}
            </div>
          )}

          <div className="form-row">
            <label>이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
          </div>
          <div className="form-row">
            <label>연락처</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
          <div className="form-row">
            <label>인원</label>
            <select value={people} onChange={(e) => setPeople(Number(e.target.value))}>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}명
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn"
            onClick={submit}
            disabled={loading || !date || remaining <= 0 || !name || !phone}
          >
            {loading ? "신청 중…" : "봉사 신청하기"}
          </button>

          {msg && (
            <p className={msg.type === "ok" ? "msg-ok" : "msg-err"} style={{ marginTop: 12 }}>
              {msg.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
