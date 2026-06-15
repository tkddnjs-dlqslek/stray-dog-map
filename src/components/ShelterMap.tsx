"use client";

import dynamic from "next/dynamic";
import type { Shelter } from "@/lib/types";

const loading = () => <div className="map-placeholder">지도를 불러오는 중…</div>;

// leaflet/kakao 모두 window에 의존 → SSR 비활성화하고 클라이언트에서만 로드
const LeafletMap = dynamic(() => import("./MapView"), { ssr: false, loading });
const KakaoMap = dynamic(() => import("./KakaoMapView"), { ssr: false, loading });

export default function ShelterMap({ shelters }: { shelters: Shelter[] }) {
  // 카카오 JavaScript 키가 설정돼 있으면 카카오맵, 없으면 OSM(Leaflet)으로 폴백
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  return kakaoKey ? (
    <KakaoMap shelters={shelters} appKey={kakaoKey} />
  ) : (
    <LeafletMap shelters={shelters} />
  );
}
