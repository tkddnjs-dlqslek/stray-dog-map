import sheltersSeed from "../../data/shelters.json";
import { fetchPublicShelters } from "./animalApi";
import { backend } from "./storage";
import type { Booking, NotifyConfig, Shelter, TimeSlot } from "./types";

// ── 슬롯 오버라이드 ────────────────────────────────────────────────────────
export async function getSlots(shelterId: string): Promise<TimeSlot[] | undefined> {
  return (await backend.getSlotOverrides())[shelterId];
}

export async function setSlots(shelterId: string, slots: TimeSlot[]): Promise<void> {
  await backend.saveSlots(shelterId, slots);
}

// ── 알림 채널 오버라이드 ────────────────────────────────────────────────────
export async function getNotify(shelterId: string): Promise<NotifyConfig | undefined> {
  return (await backend.getNotifyOverrides())[shelterId];
}

export async function setNotify(shelterId: string, config: NotifyConfig): Promise<void> {
  await backend.saveNotify(shelterId, config);
}

// ── 등록 보호소 (검수 포함) ─────────────────────────────────────────────────
export async function addRegistered(shelter: Shelter): Promise<void> {
  await backend.addRegistered(shelter);
}

export async function isRegisteredId(id: string): Promise<boolean> {
  return (await backend.listRegistered()).some((s) => s.id === id);
}

export async function getPendingShelters(): Promise<Shelter[]> {
  return (await backend.listRegistered())
    .filter((s) => s.status === "pending")
    .sort((a, b) => (b.registeredAt ?? "").localeCompare(a.registeredAt ?? ""));
}

export async function moderateShelter(
  id: string,
  action: "approve" | "reject"
): Promise<Shelter | undefined> {
  return backend.setRegisteredStatus(id, action === "approve" ? "approved" : "rejected");
}

// ── 보호소 데이터(병합) ─────────────────────────────────────────────────────
// 시드 + 승인된 등록 보호소 + 공공 API. 슬롯·알림 오버라이드 반영.
async function localShelters(): Promise<Shelter[]> {
  const [slotOverrides, notifyOverrides, registered] = await Promise.all([
    backend.getSlotOverrides(),
    backend.getNotifyOverrides(),
    backend.listRegistered(),
  ]);
  const approved = registered.filter((s) => s.status === "approved");
  const base = [...(sheltersSeed as Shelter[]), ...approved];
  return base.map((s) => ({
    ...s,
    slots: slotOverrides[s.id] ?? s.slots,
    notify: notifyOverrides[s.id] ?? s.notify,
  }));
}

export async function getShelters(): Promise<Shelter[]> {
  const local = await localShelters();
  let pub: Shelter[] = [];
  try {
    pub = await fetchPublicShelters(); // 키 없으면 []
  } catch {
    pub = [];
  }
  const ids = new Set(local.map((s) => s.id));
  return [...local, ...pub.filter((s) => !ids.has(s.id))];
}

export async function getShelter(id: string): Promise<Shelter | undefined> {
  return (await getShelters()).find((s) => s.id === id);
}

/** 로컬(시드+등록) 보호소만 — 공공 API 제외 */
export async function getLocalShelters(): Promise<Shelter[]> {
  return localShelters();
}

// ── 예약 ────────────────────────────────────────────────────────────────────
export async function readBookings(filter?: {
  shelterId?: string;
  date?: string;
}): Promise<Booking[]> {
  return backend.getBookings(filter);
}

export async function addBooking(booking: Booking): Promise<void> {
  await backend.addBooking(booking);
}

/** 특정 슬롯·날짜의 이미 신청된 인원 합계 */
export async function bookedCount(
  shelterId: string,
  slotId: string,
  date: string
): Promise<number> {
  const bookings = await backend.getBookings({ shelterId, date });
  return bookings
    .filter((b) => b.slotId === slotId)
    .reduce((sum, b) => sum + b.people, 0);
}
