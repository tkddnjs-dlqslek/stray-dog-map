"use client";

import { useState } from "react";
import Link from "next/link";
import { REGIONS } from "@/lib/regions";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    region: "",
    address: "",
    phone: "",
    email: "",
    description: "",
  });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  function set(key: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [key]: v }));
    setMsg(null);
  }

  async function submit() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/shelters/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: data.error ?? "등록에 실패했습니다." });
      } else {
        setDone(true);
      }
    } catch {
      setMsg({ type: "err", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <main className="container">
        <Link href="/" className="back-link">
          ← 지도로 돌아가기
        </Link>
        <div className="card" style={{ marginTop: 16, maxWidth: 560 }}>
          <h1 style={{ fontSize: 20, marginTop: 0 }}>🎉 등록 완료</h1>
          <p>
            <strong>{form.name}</strong>이(가) 지도에 추가됐어요. 이제 <strong>운영자 콘솔</strong>에서
            봉사 시간대를 등록하면 봉사자들이 신청할 수 있습니다.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Link className="btn" href="/manage">
              운영자 콘솔에서 시간대 등록하기 →
            </Link>
            <Link className="btn btn-outline" href="/">
              지도에서 확인
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <Link href="/" className="back-link">
        ← 지도로 돌아가기
      </Link>
      <section className="hero">
        <h1>보호소 등록</h1>
        <p>
          1365·SNS로만 봉사자를 받던 사설보호소를 멍플래너에 등록하세요. 등록 후 운영자 콘솔에서
          봉사 시간대를 열면 바로 신청을 받을 수 있어요.
        </p>
      </section>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="form-row">
          <label>보호소명 *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="○○보호소" />
        </div>
        <div className="form-row">
          <label>지역 *</label>
          <select value={form.region} onChange={(e) => set("region", e.target.value)}>
            <option value="">시/도 선택</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>주소 *</label>
          <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="○○시 ○○구 ○○로 00" />
        </div>
        <div className="form-row">
          <label>연락처</label>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="010-0000-0000" />
        </div>
        <div className="form-row">
          <label>예약 알림 이메일</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="shelter@example.com"
          />
        </div>
        <div className="form-row">
          <label>소개 (선택)</label>
          <input
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="어떤 봉사가 필요한지 한 줄로"
          />
        </div>

        <button
          className="btn"
          onClick={submit}
          disabled={saving || !form.name || !form.region || !form.address}
        >
          {saving ? "등록 중…" : "보호소 등록하기"}
        </button>
        {msg && (
          <p className={msg.type === "ok" ? "msg-ok" : "msg-err"} style={{ marginTop: 12 }}>
            {msg.text}
          </p>
        )}
        <p className="muted" style={{ marginTop: 12 }}>
          * 표시는 필수. 등록 시 사설보호소(자체예약)로 추가되며, 시간대는 운영자 콘솔에서 관리합니다.
        </p>
      </div>
    </main>
  );
}
