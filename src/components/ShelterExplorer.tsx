"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ShelterMap from "./ShelterMap";
import type { Region, Shelter } from "@/lib/types";

// 지역 정렬 순서 (수도권 → 강원 → 충청 → 호남 → 영남 → 제주)
const REGION_ORDER: Region[] = [
  "서울", "경기", "인천", "강원", "충북", "충남", "대전", "세종",
  "전북", "전남", "광주", "경북", "경남", "대구", "울산", "부산", "제주",
];

type ApplyFilter = "all" | "self" | "external";

function applyBadge(method: Shelter["applyMethod"]): { cls: string; label: string } {
  if (method === "self") return { cls: "badge-self", label: "자체예약" };
  if (method === "link1365") return { cls: "badge-1365", label: "1365 연결" };
  return { cls: "badge-ext", label: "신청링크" };
}

export default function ShelterExplorer({ shelters }: { shelters: Shelter[] }) {
  const [region, setRegion] = useState<Region | "전체">("전체");
  const [apply, setApply] = useState<ApplyFilter>("all");

  // 실제 데이터에 존재하는 지역만, 정해진 순서로 + 지역별 개수
  const regions = useMemo(() => {
    const counts = new Map<Region, number>();
    for (const s of shelters) counts.set(s.region, (counts.get(s.region) ?? 0) + 1);
    return REGION_ORDER.filter((r) => counts.has(r)).map((r) => ({
      region: r,
      count: counts.get(r)!,
    }));
  }, [shelters]);

  const filtered = useMemo(() => {
    return shelters.filter((s) => {
      if (region !== "전체" && s.region !== region) return false;
      if (apply === "self" && s.applyMethod !== "self") return false;
      if (apply === "external" && s.applyMethod === "self") return false;
      return true;
    });
  }, [shelters, region, apply]);

  return (
    <div>
      <div className="filters">
        <div className="chip-row">
          <button
            className={`chip ${region === "전체" ? "chip-on" : ""}`}
            onClick={() => setRegion("전체")}
          >
            전체 <span className="chip-count">{shelters.length}</span>
          </button>
          {regions.map(({ region: r, count }) => (
            <button
              key={r}
              className={`chip ${region === r ? "chip-on" : ""}`}
              onClick={() => setRegion(r)}
            >
              {r} <span className="chip-count">{count}</span>
            </button>
          ))}
        </div>

        <div className="chip-row" style={{ marginTop: 8 }}>
          {(
            [
              ["all", "신청방식 전체"],
              ["self", "✅ 자체예약"],
              ["external", "🔗 외부 신청"],
            ] as [ApplyFilter, string][]
          ).map(([val, label]) => (
            <button
              key={val}
              className={`chip chip-sm ${apply === val ? "chip-on" : ""}`}
              onClick={() => setApply(val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="layout">
        <ShelterMap shelters={filtered} />

        <div className="list">
          <div className="muted" style={{ marginBottom: 4 }}>
            {region === "전체" ? "전국" : region} · {filtered.length}개 보호소
          </div>

          {filtered.length === 0 && (
            <div className="card muted">조건에 맞는 보호소가 없어요. 필터를 바꿔보세요.</div>
          )}

          {filtered.map((s) => {
            const openSlots = s.slots.reduce((n, slot) => n + slot.capacity, 0);
            return (
              <Link key={s.id} href={`/shelters/${s.id}`} className="card shelter-card">
                <div className="shelter-top">
                  <h3>{s.name}</h3>
                  <span className="badge badge-region">{s.region}</span>
                  <span
                    className={`badge ${s.kind === "public" ? "badge-public" : "badge-private"}`}
                  >
                    {s.kind === "public" ? "공공" : "사설"}
                  </span>
                  <span className={`badge ${applyBadge(s.applyMethod).cls}`}>
                    {applyBadge(s.applyMethod).label}
                  </span>
                </div>
                <div className="muted">{s.address}</div>
                <p className="desc">{s.description}</p>
                {s.applyMethod === "self" && (
                  <div className="muted" style={{ marginTop: 8 }}>
                    🗓️ 주간 봉사 슬롯 {s.slots.length}개 · 모집 정원 합계 {openSlots}명
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
