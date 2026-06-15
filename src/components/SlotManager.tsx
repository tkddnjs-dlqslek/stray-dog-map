"use client";

import { useMemo, useState } from "react";
import type { Shelter, TimeSlot } from "@/lib/types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type EditableSlot = TimeSlot & { _key: string };

function withKeys(slots: TimeSlot[]): EditableSlot[] {
  return slots.map((s, i) => ({ ...s, _key: s.id || `k${i}_${Math.random().toString(36).slice(2)}` }));
}

function blankSlot(): EditableSlot {
  return {
    _key: `new_${Math.random().toString(36).slice(2)}`,
    id: "",
    weekday: 6,
    start: "10:00",
    end: "13:00",
    capacity: 4,
    label: "산책 봉사",
  };
}

export default function SlotManager({ shelters }: { shelters: Shelter[] }) {
  const [shelterId, setShelterId] = useState(shelters[0]?.id ?? "");
  const initial = useMemo<Record<string, EditableSlot[]>>(
    () => Object.fromEntries(shelters.map((s) => [s.id, withKeys(s.slots)])),
    [shelters]
  );
  const [slotsById, setSlotsById] = useState(initial);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // 보호소별 알림 웹훅 URL
  const initialNotify = useMemo<Record<string, string>>(
    () => Object.fromEntries(shelters.map((s) => [s.id, s.notify?.webhook ?? ""])),
    [shelters]
  );
  const [notifyById, setNotifyById] = useState(initialNotify);
  const [notifyMsg, setNotifyMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [savingNotify, setSavingNotify] = useState(false);

  const slots = slotsById[shelterId] ?? [];
  const webhook = notifyById[shelterId] ?? "";

  async function saveNotify() {
    setSavingNotify(true);
    setNotifyMsg(null);
    try {
      const res = await fetch("/api/notify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shelterId, webhook }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotifyMsg({ type: "err", text: data.error ?? "저장 실패" });
      } else {
        setNotifyMsg({
          type: "ok",
          text: webhook
            ? "알림 채널 저장됨. 이제 예약이 들어오면 이 웹훅으로 메시지가 갑니다."
            : "알림 채널을 비웠어요. 예약은 콘솔에서만 확인됩니다.",
        });
      }
    } catch {
      setNotifyMsg({ type: "err", text: "네트워크 오류" });
    } finally {
      setSavingNotify(false);
    }
  }

  function update(next: EditableSlot[]) {
    setSlotsById((m) => ({ ...m, [shelterId]: next }));
    setMsg(null);
  }

  function editSlot(key: string, patch: Partial<TimeSlot>) {
    update(slots.map((s) => (s._key === key ? { ...s, ...patch } : s)));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const payload = slots.map(({ _key, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars
      const res = await fetch("/api/slots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shelterId, slots: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: data.error ?? "저장에 실패했습니다." });
      } else {
        setSlotsById((m) => ({ ...m, [shelterId]: withKeys(data.slots) }));
        setMsg({ type: "ok", text: "저장됐어요. 봉사자 화면에 바로 반영됩니다." });
      }
    } catch {
      setMsg({ type: "err", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setSaving(false);
    }
  }

  if (shelters.length === 0) {
    return <div className="card muted">관리할 사설보호소가 없습니다.</div>;
  }

  return (
    <div>
      <div className="form-row" style={{ maxWidth: 360 }}>
        <label>보호소 선택</label>
        <select value={shelterId} onChange={(e) => setShelterId(e.target.value)}>
          {shelters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.region})
            </option>
          ))}
        </select>
      </div>

      <table className="slot-table">
        <thead>
          <tr>
            <th>요일</th>
            <th>시작</th>
            <th>종료</th>
            <th>정원</th>
            <th>봉사 내용</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {slots.map((s) => (
            <tr key={s._key}>
              <td>
                <select
                  value={s.weekday}
                  onChange={(e) => editSlot(s._key, { weekday: Number(e.target.value) })}
                >
                  {WEEKDAYS.map((w, i) => (
                    <option key={i} value={i}>
                      {w}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="time"
                  value={s.start}
                  onChange={(e) => editSlot(s._key, { start: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="time"
                  value={s.end}
                  onChange={(e) => editSlot(s._key, { end: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={s.capacity}
                  style={{ width: 64 }}
                  onChange={(e) => editSlot(s._key, { capacity: Number(e.target.value) })}
                />
              </td>
              <td>
                <input
                  value={s.label}
                  onChange={(e) => editSlot(s._key, { label: e.target.value })}
                />
              </td>
              <td>
                <button
                  className="btn-icon"
                  title="삭제"
                  onClick={() => update(slots.filter((x) => x._key !== s._key))}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
          {slots.length === 0 && (
            <tr>
              <td colSpan={6} className="muted" style={{ textAlign: "center", padding: 16 }}>
                등록된 시간대가 없습니다. 아래에서 추가하세요.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="btn btn-outline" onClick={() => update([...slots, blankSlot()])}>
          + 시간대 추가
        </button>
        <button className="btn" onClick={save} disabled={saving}>
          {saving ? "저장 중…" : "저장하기"}
        </button>
      </div>

      {msg && (
        <p className={msg.type === "ok" ? "msg-ok" : "msg-err"} style={{ marginTop: 12 }}>
          {msg.text}
        </p>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 4px" }}>📨 예약 알림 채널</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          예약이 들어오면 이 주소로 알림 메시지가 전송됩니다. Discord/Slack 채널의 웹훅 URL을
          붙여넣으세요. (비워두면 콘솔에서만 확인)
        </p>
        <div className="form-row">
          <label>웹훅 URL</label>
          <input
            value={webhook}
            placeholder="https://discord.com/api/webhooks/..."
            onChange={(e) => {
              setNotifyById((m) => ({ ...m, [shelterId]: e.target.value }));
              setNotifyMsg(null);
            }}
          />
        </div>
        <button className="btn" onClick={saveNotify} disabled={savingNotify}>
          {savingNotify ? "저장 중…" : "알림 채널 저장"}
        </button>
        {notifyMsg && (
          <p
            className={notifyMsg.type === "ok" ? "msg-ok" : "msg-err"}
            style={{ marginTop: 12 }}
          >
            {notifyMsg.text}
          </p>
        )}
      </div>
    </div>
  );
}
