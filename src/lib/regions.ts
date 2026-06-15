import type { Region } from "./types";

// 광역시/도 표시 순서 (수도권 → 강원 → 충청 → 호남 → 영남 → 제주)
export const REGIONS: Region[] = [
  "서울", "경기", "인천", "강원", "충북", "충남", "대전", "세종",
  "전북", "전남", "광주", "경북", "경남", "대구", "울산", "부산", "제주",
];

// 시/도 중심 좌표 (지오코딩 없이 등록 보호소를 지도에 배치할 때 사용)
export const REGION_CENTERS: Record<Region, [number, number]> = {
  서울: [37.5665, 126.978],
  경기: [37.2752, 127.0095],
  인천: [37.4563, 126.7052],
  강원: [37.8228, 128.1555],
  충북: [36.6357, 127.4917],
  충남: [36.6588, 126.6728],
  대전: [36.3504, 127.3845],
  세종: [36.48, 127.289],
  전북: [35.7175, 127.153],
  전남: [34.8161, 126.4629],
  광주: [35.1595, 126.8526],
  경북: [36.4919, 128.8889],
  경남: [35.4606, 128.2132],
  대구: [35.8714, 128.6014],
  울산: [35.5384, 129.3114],
  부산: [35.1796, 129.0756],
  제주: [33.4996, 126.5312],
};

export function isRegion(v: unknown): v is Region {
  return typeof v === "string" && (REGIONS as string[]).includes(v);
}

// 이름 기반 결정적 좌표 흔들림 — 같은 시/도 마커 겹침 방지 (운영 시 지오코딩 권장)
export function regionJitter(seed: string, region: Region): [number, number] {
  const center = REGION_CENTERS[region];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  const dLat = ((h % 100) / 100 - 0.5) * 0.16;
  const dLng = (((h >> 8) % 100) / 100 - 0.5) * 0.16;
  return [center[0] + dLat, center[1] + dLng];
}
