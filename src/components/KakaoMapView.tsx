"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Shelter } from "@/lib/types";

declare global {
  interface Window {
    kakao: any;
  }
}

// 카카오맵 SDK를 한 번만 로드 (autoload=false 후 maps.load 콜백 대기)
let sdkPromise: Promise<void> | null = null;
function loadKakao(appKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.kakao?.maps) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => reject(new Error("Kakao SDK load failed"));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export default function KakaoMapView({
  shelters,
  appKey,
}: {
  shelters: Shelter[];
  appKey: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const infoRef = useRef<any>(null);
  const router = useRouter();

  function openInfo(kakao: any, s: Shelter, pos: any) {
    infoRef.current?.setMap(null);
    const el = document.createElement("div");
    el.className = "kakao-info";
    el.innerHTML = `
      <strong>${s.name}</strong>
      <div class="kakao-info-addr">${s.address}</div>
      <div class="kakao-info-tag">${s.applyMethod === "self" ? "✅ 자체예약" : "🔗 1365 연결"}</div>
      <a class="kakao-info-link">자세히 보기 →</a>`;
    el.querySelector("a")!.addEventListener("click", () => router.push(`/shelters/${s.id}`));
    const info = new kakao.maps.CustomOverlay({ position: pos, content: el, yAnchor: 1.35, zIndex: 10 });
    info.setMap(mapRef.current);
    infoRef.current = info;
  }

  function render(kakao: any) {
    const map = mapRef.current;
    if (!map) return;
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    infoRef.current?.setMap(null);
    if (shelters.length === 0) return;

    const bounds = new kakao.maps.LatLngBounds();
    shelters.forEach((s) => {
      const pos = new kakao.maps.LatLng(s.lat, s.lng);
      bounds.extend(pos);
      const color = s.kind === "public" ? "#3949ab" : "#2f7d5b";
      const el = document.createElement("div");
      el.className = "kakao-pin";
      el.style.background = color;
      el.title = s.name;
      el.addEventListener("click", () => openInfo(kakao, s, pos));
      const overlay = new kakao.maps.CustomOverlay({ position: pos, content: el, yAnchor: 1 });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });

    if (shelters.length === 1) {
      map.setCenter(new kakao.maps.LatLng(shelters[0].lat, shelters[0].lng));
      map.setLevel(6);
    } else {
      map.setBounds(bounds, 40, 40, 40, 40);
    }
  }

  // SDK 로드 + 지도 생성
  useEffect(() => {
    let cancelled = false;
    loadKakao(appKey)
      .then(() => {
        if (cancelled || !ref.current) return;
        const kakao = window.kakao;
        if (!mapRef.current) {
          mapRef.current = new kakao.maps.Map(ref.current, {
            center: new kakao.maps.LatLng(36.5, 127.8),
            level: 13,
          });
        }
        render(kakao);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appKey]);

  // 필터 변경 시 마커 갱신
  useEffect(() => {
    if (window.kakao?.maps && mapRef.current) render(window.kakao);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelters]);

  return <div ref={ref} className="map-wrap" />;
}
