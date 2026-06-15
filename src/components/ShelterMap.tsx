"use client";

import dynamic from "next/dynamic";
import type { Shelter } from "@/lib/types";

// leaflet은 window에 의존하므로 SSR 비활성화하고 클라이언트에서만 로드
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="map-placeholder">지도를 불러오는 중…</div>,
});

export default function ShelterMap({ shelters }: { shelters: Shelter[] }) {
  return <MapView shelters={shelters} />;
}
