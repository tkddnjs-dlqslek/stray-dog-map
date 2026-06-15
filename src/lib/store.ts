import fs from "fs";
import path from "path";
import sheltersSeed from "../../data/shelters.json";
import { fetchPublicShelters } from "./animalApi";
import type { Booking, NotifyConfig, Shelter, TimeSlot } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const SLOTS_PATH = path.join(DATA_DIR, "slots.json");
const NOTIFY_PATH = path.join(DATA_DIR, "notify.json");
const BOOKINGS_PATH = path.join(DATA_DIR, "bookings.json");
const REGISTERED_PATH = path.join(DATA_DIR, "registered.json");

// ── 슬롯 오버라이드 (운영자 콘솔이 수정하는 영속 데이터) ─────────────────
// 시드 보호소의 slots를 기본값으로 쓰되, 콘솔에서 저장하면 이 파일이 우선한다.
type SlotsStore = Record<string, TimeSlot[]>;

function readSlotsStore(): SlotsStore {
  try {
    return JSON.parse(fs.readFileSync(SLOTS_PATH, "utf-8")) as SlotsStore;
  } catch {
    return {};
  }
}

export function getSlots(shelterId: string): TimeSlot[] | undefined {
  return readSlotsStore()[shelterId];
}

export function setSlots(shelterId: string, slots: TimeSlot[]): void {
  const store = readSlotsStore();
  store[shelterId] = slots;
  fs.writeFileSync(SLOTS_PATH, JSON.stringify(store, null, 2), "utf-8");
}

// ── 알림 채널 오버라이드 (운영자 콘솔이 설정하는 영속 데이터) ─────────────
type NotifyStore = Record<string, NotifyConfig>;

function readNotifyStore(): NotifyStore {
  try {
    return JSON.parse(fs.readFileSync(NOTIFY_PATH, "utf-8")) as NotifyStore;
  } catch {
    return {};
  }
}

export function getNotify(shelterId: string): NotifyConfig | undefined {
  return readNotifyStore()[shelterId];
}

export function setNotify(shelterId: string, config: NotifyConfig): void {
  const store = readNotifyStore();
  store[shelterId] = config;
  fs.writeFileSync(NOTIFY_PATH, JSON.stringify(store, null, 2), "utf-8");
}

// ── 등록 보호소 (수집/자기등록으로 추가되는 실데이터) ──────────────────────
function readRegistered(): Shelter[] {
  try {
    return JSON.parse(fs.readFileSync(REGISTERED_PATH, "utf-8")) as Shelter[];
  } catch {
    return [];
  }
}

export function addRegistered(shelter: Shelter): void {
  const list = readRegistered();
  list.push(shelter);
  fs.writeFileSync(REGISTERED_PATH, JSON.stringify(list, null, 2), "utf-8");
}

// ── 보호소 데이터 ────────────────────────────────────────────────────────
// 시드 + 등록 보호소(실데이터) + 공공 API(전국 공공). 슬롯·알림 오버라이드 반영.
function localShelters(): Shelter[] {
  const slotOverrides = readSlotsStore();
  const notifyOverrides = readNotifyStore();
  const base = [...(sheltersSeed as Shelter[]), ...readRegistered()];
  return base.map((s) => ({
    ...s,
    slots: slotOverrides[s.id] ?? s.slots,
    notify: notifyOverrides[s.id] ?? s.notify,
  }));
}

export async function getShelters(): Promise<Shelter[]> {
  const local = localShelters();
  let pub: Shelter[] = [];
  try {
    pub = await fetchPublicShelters(); // 키 없으면 []
  } catch {
    pub = [];
  }
  // 시드 id와 충돌하지 않는 공공 보호소만 추가
  const ids = new Set(local.map((s) => s.id));
  return [...local, ...pub.filter((s) => !ids.has(s.id))];
}

export async function getShelter(id: string): Promise<Shelter | undefined> {
  return (await getShelters()).find((s) => s.id === id);
}

/** 정적 경로 생성·테스트용: 공공 API 없이 로컬 시드만 */
export function getLocalShelters(): Shelter[] {
  return localShelters();
}

// ── 예약 저장소 ──────────────────────────────────────────────────────────
export function readBookings(): Booking[] {
  try {
    return JSON.parse(fs.readFileSync(BOOKINGS_PATH, "utf-8")) as Booking[];
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
