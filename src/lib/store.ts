import fs from "fs";
import path from "path";
import sheltersSeed from "../../data/shelters.json";
import type { Booking, Shelter } from "./types";

// 보호소 데이터: 지금은 시드 JSON. 추후 동물보호관리시스템 공공 API로 교체 가능한 지점.
export function getShelters(): Shelter[] {
  return sheltersSeed as Shelter[];
}

export function getShelter(id: string): Shelter | undefined {
  return getShelters().find((s) => s.id === id);
}

// 예약은 data/bookings.json 파일에 영속화 (MVP용 간이 저장소).
const BOOKINGS_PATH = path.join(process.cwd(), "data", "bookings.json");

export function readBookings(): Booking[] {
  try {
    const raw = fs.readFileSync(BOOKINGS_PATH, "utf-8");
    return JSON.parse(raw) as Booking[];
  } catch {
    return [];
  }
}

export function writeBookings(bookings: Booking[]): void {
  fs.writeFileSync(BOOKINGS_PATH, JSON.stringify(bookings, null, 2), "utf-8");
}

/** 특정 슬롯·날짜의 이미 신청된 인원 합계 */
export function bookedCount(shelterId: string, slotId: string, date: string): number {
  return readBookings()
    .filter((b) => b.shelterId === shelterId && b.slotId === slotId && b.date === date)
    .reduce((sum, b) => sum + b.people, 0);
}
