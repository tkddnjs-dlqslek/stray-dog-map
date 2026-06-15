// 봉사 신청 방식:
//  - self        : 멍플래너 자체 타임테이블 예약
//  - link1365    : 1365 자원봉사포털 모집글로 연결(봉사시간 인증)
//  - linkExternal: 보호소 자체 신청 채널(네이버폼/구글폼/오픈카톡/인스타 등)로 연결
export type ApplyMethod = "self" | "link1365" | "linkExternal";

export interface TimeSlot {
  id: string;
  /** 요일: 0(일)~6(토) */
  weekday: number;
  /** "10:00" 형식 시작 시각 */
  start: string;
  /** "13:00" 형식 종료 시각 */
  end: string;
  /** 회당 모집 정원 */
  capacity: number;
  /** 봉사 내용 한줄 설명 */
  label: string;
}

/** 광역시/도 단위 지역 카테고리 */
export type Region =
  | "서울"
  | "경기"
  | "인천"
  | "강원"
  | "충북"
  | "충남"
  | "대전"
  | "세종"
  | "전북"
  | "전남"
  | "광주"
  | "경북"
  | "경남"
  | "대구"
  | "울산"
  | "부산"
  | "제주";

export interface Shelter {
  id: string;
  name: string;
  /** 공공(지자체/위탁) vs 사설(개인 운영) */
  kind: "public" | "private";
  /** 광역시/도 단위 지역 */
  region: Region;
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  description: string;
  applyMethod: ApplyMethod;
  /** applyMethod === "link1365" 일 때 연결할 1365 모집글 URL */
  link1365?: string;
  /** applyMethod === "linkExternal" 일 때 연결할 보호소 자체 신청 URL */
  applyUrl?: string;
  /** linkExternal 신청 채널 종류 라벨 (예: "네이버폼", "오픈카톡") */
  applyChannel?: string;
  /** applyMethod === "self" 일 때 노출할 주간 봉사 타임슬롯 */
  slots: TimeSlot[];
  /** 예약 발생 시 보호소가 알림을 받을 채널 (운영자 콘솔에서 설정) */
  notify?: NotifyConfig;
  /** 데이터 출처: 시드/커뮤니티 등록/공공 API */
  source?: "seed" | "community" | "public";
  /** 검수 상태 (커뮤니티 등록 보호소만 사용). 미지정 = 승인된 것으로 간주 */
  status?: "pending" | "approved" | "rejected";
  /** 등록 시각(ISO) — 검수 목록 정렬용 */
  registeredAt?: string;
}

export interface NotifyConfig {
  /** Discord/Slack/일반 웹훅 URL. 예약 완료 시 이 주소로 POST 발송 */
  webhook?: string;
  /** 예약 알림을 받을 보호소 이메일 주소 */
  email?: string;
}

export interface Booking {
  id: string;
  shelterId: string;
  slotId: string;
  /** 신청한 봉사 날짜 (YYYY-MM-DD) */
  date: string;
  name: string;
  phone: string;
  people: number;
  createdAt: string;
}
