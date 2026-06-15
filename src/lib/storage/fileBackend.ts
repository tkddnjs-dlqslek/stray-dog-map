import fs from "fs";
import path from "path";
import type { Booking, NotifyConfig, Shelter, TimeSlot } from "../types";
import type { StorageBackend } from "./index";

// 쓰기 가능한 데이터 디렉터리 (서버리스/컨테이너 대응). 미설정 시 ./data.
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
const SLOTS_PATH = path.join(DATA_DIR, "slots.json");
const NOTIFY_PATH = path.join(DATA_DIR, "notify.json");
const BOOKINGS_PATH = path.join(DATA_DIR, "bookings.json");
const REGISTERED_PATH = path.join(DATA_DIR, "registered.json");

function ensureDir(): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    /* write 시점에 에러로 드러남 */
  }
}

function readJson<T>(p: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(p: string, data: unknown): void {
  ensureDir();
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf-8");
}

export const fileBackend: StorageBackend = {
  async getSlotOverrides() {
    return readJson<Record<string, TimeSlot[]>>(SLOTS_PATH, {});
  },
  async saveSlots(shelterId, slots) {
    const store = readJson<Record<string, TimeSlot[]>>(SLOTS_PATH, {});
    store[shelterId] = slots;
    writeJson(SLOTS_PATH, store);
  },

  async getNotifyOverrides() {
    return readJson<Record<string, NotifyConfig>>(NOTIFY_PATH, {});
  },
  async saveNotify(shelterId, config) {
    const store = readJson<Record<string, NotifyConfig>>(NOTIFY_PATH, {});
    store[shelterId] = config;
    writeJson(NOTIFY_PATH, store);
  },

  async listRegistered() {
    return readJson<Shelter[]>(REGISTERED_PATH, []);
  },
  async addRegistered(shelter) {
    const list = readJson<Shelter[]>(REGISTERED_PATH, []);
    list.push(shelter);
    writeJson(REGISTERED_PATH, list);
  },
  async setRegisteredStatus(id, status) {
    const list = readJson<Shelter[]>(REGISTERED_PATH, []);
    const target = list.find((s) => s.id === id);
    if (!target) return undefined;
    target.status = status;
    writeJson(REGISTERED_PATH, list);
    return target;
  },

  async getBookings(filter) {
    let list = readJson<Booking[]>(BOOKINGS_PATH, []);
    if (filter?.shelterId) list = list.filter((b) => b.shelterId === filter.shelterId);
    if (filter?.date) list = list.filter((b) => b.date === filter.date);
    return list;
  },
  async addBooking(b) {
    const list = readJson<Booking[]>(BOOKINGS_PATH, []);
    list.push(b);
    writeJson(BOOKINGS_PATH, list);
  },
};
