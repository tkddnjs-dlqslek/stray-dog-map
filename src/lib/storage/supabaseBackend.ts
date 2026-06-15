import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Booking, NotifyConfig, Shelter, TimeSlot } from "../types";
import type { StorageBackend } from "./index";

// Supabase(Postgres) 백엔드. 스키마는 supabase/schema.sql 참고.
// 서버 전용 — 서비스 롤 키를 사용하므로 절대 클라이언트로 노출 금지.
function client(): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

interface BookingRow {
  id: string;
  shelter_id: string;
  slot_id: string;
  date: string;
  name: string;
  phone: string;
  people: number;
  created_at: string;
}

const rowToBooking = (r: BookingRow): Booking => ({
  id: r.id,
  shelterId: r.shelter_id,
  slotId: r.slot_id,
  date: r.date,
  name: r.name,
  phone: r.phone,
  people: r.people,
  createdAt: r.created_at,
});

export function createSupabaseBackend(): StorageBackend {
  const db = client();

  return {
    async getSlotOverrides() {
      const { data, error } = await db.from("slot_overrides").select("shelter_id, slots");
      if (error) throw error;
      const map: Record<string, TimeSlot[]> = {};
      for (const row of data ?? []) map[row.shelter_id] = row.slots as TimeSlot[];
      return map;
    },
    async saveSlots(shelterId, slots) {
      const { error } = await db
        .from("slot_overrides")
        .upsert({ shelter_id: shelterId, slots }, { onConflict: "shelter_id" });
      if (error) throw error;
    },

    async getNotifyOverrides() {
      const { data, error } = await db.from("notify_configs").select("shelter_id, config");
      if (error) throw error;
      const map: Record<string, NotifyConfig> = {};
      for (const row of data ?? []) map[row.shelter_id] = row.config as NotifyConfig;
      return map;
    },
    async saveNotify(shelterId, config) {
      const { error } = await db
        .from("notify_configs")
        .upsert({ shelter_id: shelterId, config }, { onConflict: "shelter_id" });
      if (error) throw error;
    },

    async listRegistered() {
      const { data, error } = await db.from("registered_shelters").select("data");
      if (error) throw error;
      return (data ?? []).map((r) => r.data as Shelter);
    },
    async addRegistered(shelter) {
      const { error } = await db
        .from("registered_shelters")
        .insert({ id: shelter.id, status: shelter.status ?? "pending", data: shelter });
      if (error) throw error;
    },
    async setRegisteredStatus(id, status) {
      const { data: rows, error: selErr } = await db
        .from("registered_shelters")
        .select("data")
        .eq("id", id)
        .limit(1);
      if (selErr) throw selErr;
      const shelter = rows?.[0]?.data as Shelter | undefined;
      if (!shelter) return undefined;
      const updated = { ...shelter, status };
      const { error } = await db
        .from("registered_shelters")
        .update({ status, data: updated })
        .eq("id", id);
      if (error) throw error;
      return updated;
    },

    async getBookings(filter) {
      let q = db.from("bookings").select("*");
      if (filter?.shelterId) q = q.eq("shelter_id", filter.shelterId);
      if (filter?.date) q = q.eq("date", filter.date);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r) => rowToBooking(r as BookingRow));
    },
    async addBooking(b) {
      const { error } = await db.from("bookings").insert({
        id: b.id,
        shelter_id: b.shelterId,
        slot_id: b.slotId,
        date: b.date,
        name: b.name,
        phone: b.phone,
        people: b.people,
        created_at: b.createdAt,
      });
      if (error) throw error;
    },
  };
}
