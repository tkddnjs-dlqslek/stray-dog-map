"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import type { Shelter } from "@/lib/types";

// 보호소 종류별 핀 색상 (public=파랑, private=초록)
function pinIcon(color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.3 0 0 6.3 0 14c0 9.5 14 26 14 26s14-16.5 14-26C28 6.3 21.7 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="6" fill="#fff"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "shelter-pin",
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });
}

const publicIcon = pinIcon("#3949ab");
const privateIcon = pinIcon("#2f7d5b");

// 필터된 보호소가 바뀌면 지도 영역을 마커에 맞게 자동 조정
function FitBounds({ shelters }: { shelters: Shelter[] }) {
  const map = useMap();
  useEffect(() => {
    if (shelters.length === 0) return;
    if (shelters.length === 1) {
      map.setView([shelters[0].lat, shelters[0].lng], 12);
      return;
    }
    const bounds = L.latLngBounds(shelters.map((s) => [s.lat, s.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [shelters, map]);
  return null;
}

export default function MapView({ shelters }: { shelters: Shelter[] }) {
  const center: [number, number] = [36.5, 127.8];

  return (
    <MapContainer center={center} zoom={7} className="map-wrap" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds shelters={shelters} />
      {shelters.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={s.kind === "public" ? publicIcon : privateIcon}
        >
          <Popup>
            <strong>{s.name}</strong>
            <br />
            <span style={{ color: "#6b7280", fontSize: 12 }}>{s.address}</span>
            <br />
            <span style={{ fontSize: 12 }}>
              {s.applyMethod === "self"
                ? "✅ 자체 타임테이블 예약"
                : s.applyMethod === "link1365"
                ? "🔗 1365 연결"
                : "🔗 외부 신청"}
            </span>
            <br />
            <Link href={`/shelters/${s.id}`} style={{ color: "#2f7d5b", fontWeight: 700 }}>
              자세히 보기 →
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
