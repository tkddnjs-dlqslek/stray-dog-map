import type { Booking, NotifyConfig, Shelter, TimeSlot } from "../types";

// 저장소 백엔드 인터페이스 — 파일/Supabase 두 구현이 이 형태를 만족한다.
export interface StorageBackend {
  getSlotOverrides(): Promise<Record<string, TimeSlot[]>>;
  saveSlots(shelterId: string, slots: TimeSlot[]): Promise<void>;

  getNotifyOverrides(): Promise<Record<string, NotifyConfig>>;
  saveNotify(shelterId: string, config: NotifyConfig): Promise<void>;

  listRegistered(): Promise<Shelter[]>;
  addRegistered(shelter: Shelter): Promise<void>;
  setRegisteredStatus(id: string, status: NonNullable<Shelter["status"]>): Promise<Shelter | undefined>;

  getBookings(filter?: { shelterId?: string; date?: string }): Promise<Booking[]>;
  addBooking(b: Booking): Promise<void>;
}

import { fileBackend } from "./fileBackend";
import { createSupabaseBackend } from "./supabaseBackend";

// SUPABASE_URL + 서비스 키가 있으면 Supabase, 없으면 파일 백엔드(로컬/데모).
export const backend: StorageBackend =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseBackend()
    : fileBackend;

export const usingSupabase = !!(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);
