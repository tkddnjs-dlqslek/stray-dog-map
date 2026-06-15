"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Shelter } from "@/lib/types";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [pending, setPending] = useState<Shelter[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setMsg(null);
    const res = await fetch("/api/moderation", {
      headers: token ? { "x-admin-token": token } : {},
    });
    if (res.status === 401) {
      setMsg("권한이 없습니다. 관리자 토큰을 확인하세요.");
      return;
    }
    const data = await res.json();
    setPending(data.pending ?? []);
    setLoaded(true);
  }, [token]);

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function moderate(id: string, action: "approve" | "reject") {
    const res = await fetch("/api/moderation", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(token ? { "x-admin-token": token } : {}) },
      body: JSON.stringify({ id, action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "처리 실패");
      return;
    }
    setPending((list) => list.filter((s) => s.id !== id));
    setMsg(action === "approve" ? "승인됨 — 지도에 노출됩니다." : "거절됨.");
  }

  return (
    <main className="container">
      <Link href="/" className="back-link">
        ← 지도로 돌아가기
      </Link>
      <section className="hero">
        <h1>관리자 · 등록 검수</h1>
        <p>자기등록한 보호소를 확인하고 승인하면 지도에 노출됩니다. 스팸·중복·허위는 거절하세요.</p>
      </section>

      <div className="card" style={{ maxWidth: 420, marginBottom: 16 }}>
        <div className="form-row" style={{ marginBottom: 8 }}>
          <label>관리자 토큰 (ADMIN_TOKEN 설정 시)</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="미설정 환경이면 비워두세요"
          />
        </div>
        <button className="btn btn-outline" onClick={load}>
          목록 불러오기
        </button>
      </div>

      {msg && <p className="muted" style={{ marginBottom: 12 }}>{msg}</p>}

      {loaded && pending.length === 0 && (
        <div className="card muted">검수 대기 중인 보호소가 없습니다.</div>
      )}

      <div className="list">
        {pending.map((s) => (
          <div key={s.id} className="card">
            <div className="shelter-top">
              <h3>{s.name}</h3>
              <span className="badge badge-region">{s.region}</span>
              <span className="badge badge-private">사설</span>
            </div>
            <div className="muted">
              {s.address}
              {s.phone ? ` · ${s.phone}` : ""}
              {s.notify?.email ? ` · ${s.notify.email}` : ""}
            </div>
            <p className="desc">{s.description}</p>
            <div className="muted" style={{ fontSize: 12 }}>
              신청: {s.registeredAt ? new Date(s.registeredAt).toLocaleString("ko-KR") : "-"}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="btn" onClick={() => moderate(s.id, "approve")}>
                승인
              </button>
              <button className="btn btn-danger" onClick={() => moderate(s.id, "reject")}>
                거절
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
