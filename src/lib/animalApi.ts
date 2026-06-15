import type { Region, Shelter } from "./types";

// 국가동물보호정보시스템(동물보호관리시스템) 공공데이터 보호소 정보 API.
// 서비스키는 공공데이터포털(data.go.kr)에서 발급받아 ANIMAL_SERVICE_KEY 환경변수로 주입.
// 테스트 시 ANIMAL_API_BASE로 엔드포인트 베이스를 바꿔치기 할 수 있다.
// https://www.data.go.kr/data/15098931/openapi.do
const BASE =
  process.env.ANIMAL_API_BASE ?? "https://apis.data.go.kr/1543061/animalShelterSrvc_v2";
const ENDPOINT = `${BASE}/shelterInfo`;
const PAGE_SIZE = 1000;

// 시도 코드(upr_cd) → 지역 카테고리 + 중심좌표
const SIDO: { code: string; region: Region; center: [number, number] }[] = [
  { code: "6110000", region: "서울", center: [37.5665, 126.978] },
  { code: "6410000", region: "경기", center: [37.2752, 127.0095] },
  { code: "6280000", region: "인천", center: [37.4563, 126.7052] },
  { code: "6530000", region: "강원", center: [37.8228, 128.1555] },
  { code: "6430000", region: "충북", center: [36.6357, 127.4917] },
  { code: "6440000", region: "충남", center: [36.6588, 126.6728] },
  { code: "6300000", region: "대전", center: [36.3504, 127.3845] },
  { code: "5690000", region: "세종", center: [36.48, 127.289] },
  { code: "6540000", region: "전북", center: [35.7175, 127.153] },
  { code: "6460000", region: "전남", center: [34.8161, 126.4629] },
  { code: "6290000", region: "광주", center: [35.1595, 126.8526] },
  { code: "6470000", region: "경북", center: [36.4919, 128.8889] },
  { code: "6480000", region: "경남", center: [35.4606, 128.2132] },
  { code: "6270000", region: "대구", center: [35.8714, 128.6014] },
  { code: "6310000", region: "울산", center: [35.5384, 129.3114] },
  { code: "6260000", region: "부산", center: [35.1796, 129.0756] },
  { code: "6500000", region: "제주", center: [33.4996, 126.5312] },
];

interface ApiShelterItem {
  careNm?: string;
  careTel?: string;
  careAddr?: string;
  orgNm?: string;
  divisionNm?: string;
  lat?: string | number;
  lng?: string | number;
}

function jitterFromName(name: string, center: [number, number]): [number, number] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  const dLat = ((h % 100) / 100 - 0.5) * 0.18;
  const dLng = (((h >> 8) % 100) / 100 - 0.5) * 0.18;
  return [center[0] + dLat, center[1] + dLng];
}

function slug(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// 공개: API 아이템 → 우리 Shelter 모델 (픽스처 검증용으로 export)
export function mapItem(
  item: ApiShelterItem,
  region: Region,
  center: [number, number]
): Shelter | null {
  const name = item.careNm?.trim();
  if (!name) return null;
  const hasCoord = item.lat != null && item.lng != null && !Number.isNaN(Number(item.lat));
  const [lat, lng] = hasCoord
    ? [Number(item.lat), Number(item.lng)]
    : jitterFromName(name, center);
  return {
    id: `pub-${slug(name + (item.careAddr ?? ""))}`,
    name,
    kind: "public",
    region,
    lat,
    lng,
    address: item.careAddr?.trim() ?? `${region} 일대`,
    phone: item.careTel?.trim(),
    description: `${item.orgNm ?? region} 관할 보호소. 봉사 신청·실적 인증은 1365 자원봉사포털을 통해 진행됩니다.`,
    applyMethod: "link1365",
    link1365:
      "https://www.1365.go.kr/vols/search/realmList.do?searchWord=%EC%9C%A0%EA%B8%B0%EA%B2%AC",
    slots: [],
    source: "public",
  };
}

interface SidoFetch {
  shelters: Shelter[];
  error?: string;
}

async function fetchSido(
  key: string,
  code: string,
  region: Region,
  center: [number, number]
): Promise<SidoFetch> {
  const shelters: Shelter[] = [];
  let pageNo = 1;
  // totalCount 기반 페이지네이션 (보통 시도당 1페이지면 충분하지만 안전하게 반복)
  for (;;) {
    const url =
      `${ENDPOINT}?serviceKey=${encodeURIComponent(key)}&upr_cd=${code}` +
      `&_type=json&numOfRows=${PAGE_SIZE}&pageNo=${pageNo}`;
    let json: any;
    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) return { shelters, error: `HTTP ${res.status}` };
      json = await res.json();
    } catch (e) {
      return { shelters, error: String(e) };
    }
    // data.go.kr는 200이어도 header.resultCode로 오류를 알린다
    const resultCode = json?.response?.header?.resultCode;
    if (resultCode && resultCode !== "00") {
      return { shelters, error: `resultCode ${resultCode}: ${json?.response?.header?.resultMsg ?? ""}` };
    }
    const raw = json?.response?.body?.items?.item;
    const items: ApiShelterItem[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const it of items) {
      const s = mapItem(it, region, center);
      if (s) shelters.push(s);
    }
    const totalCount = Number(json?.response?.body?.totalCount ?? items.length);
    if (pageNo * PAGE_SIZE >= totalCount || items.length === 0) break;
    pageNo += 1;
  }
  return { shelters };
}

/**
 * 전국 보호소를 공공 API에서 가져온다. ANIMAL_SERVICE_KEY 가 없으면 빈 배열.
 * 일부 시도 호출이 실패해도 나머지는 반환한다.
 */
export async function fetchPublicShelters(): Promise<Shelter[]> {
  const key = process.env.ANIMAL_SERVICE_KEY;
  if (!key) return [];
  const results = await Promise.all(
    SIDO.map(({ code, region, center }) => fetchSido(key, code, region, center))
  );
  const shelters: Shelter[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    for (const s of r.shelters) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      shelters.push(s);
    }
  }
  return shelters;
}

/** 연동 상태 진단 — 키 존재 여부, 지역별 수집 수, 오류를 반환 (관리자 확인용) */
export async function fetchPublicSheltersDiagnostic(): Promise<{
  keyPresent: boolean;
  base: string;
  total: number;
  byRegion: Record<string, number>;
  errors: { region: string; error: string }[];
}> {
  const key = process.env.ANIMAL_SERVICE_KEY;
  const byRegion: Record<string, number> = {};
  const errors: { region: string; error: string }[] = [];
  if (!key) return { keyPresent: false, base: BASE, total: 0, byRegion, errors };

  const results = await Promise.all(
    SIDO.map(async ({ code, region, center }) => ({
      region,
      ...(await fetchSido(key, code, region, center)),
    }))
  );
  let total = 0;
  for (const r of results) {
    byRegion[r.region] = r.shelters.length;
    total += r.shelters.length;
    if (r.error) errors.push({ region: r.region, error: r.error });
  }
  return { keyPresent: true, base: BASE, total, byRegion, errors };
}
