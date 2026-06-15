// 봉사 신청 방식: 1365 딥링크 연결 vs 우리 서비스 자체 예약
export type ApplyMethod = "self" | "link1365";

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
  /** applyMethod === "self" 일 때 노출할 주간 봉사 타임슬롯 */
  slots: TimeSlot[];
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
