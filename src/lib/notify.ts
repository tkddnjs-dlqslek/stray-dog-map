import type { Booking, Shelter, TimeSlot } from "./types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export interface NotifyResult {
  sent: boolean;
  channel?: "webhook";
  status?: number;
  reason?: string;
}

/**
 * 예약 완료 시 보호소에 알림을 보낸다. (best-effort — 실패해도 예약은 유지)
 * 대상 웹훅: 보호소별 설정(shelter.notify.webhook) > 환경변수 NOTIFY_WEBHOOK_DEFAULT.
 * Discord(content) / Slack(text) / 일반 수신기(booking 원본) 모두 호환되도록 payload 구성.
 */
export async function notifyShelter(
  shelter: Shelter,
  slot: TimeSlot,
  booking: Booking
): Promise<NotifyResult> {
  const webhook = shelter.notify?.webhook || process.env.NOTIFY_WEBHOOK_DEFAULT;
  if (!webhook) return { sent: false, reason: "no-channel" };

  const day = WEEKDAYS[new Date(`${booking.date}T00:00:00`).getDay()];
  const message =
    `🐾 새 봉사 신청이 들어왔어요\n` +
    `· 보호소: ${shelter.name}\n` +
    `· 일시: ${booking.date}(${day}) ${slot.start}~${slot.end} — ${slot.label}\n` +
    `· 신청자: ${booking.name} (${booking.phone}) / ${booking.people}명`;

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: message, // Discord
        text: message, // Slack
        type: "booking.created", // 일반 수신기
        shelterId: shelter.id,
        booking,
        slot,
      }),
    });
    return { sent: res.ok, channel: "webhook", status: res.status };
  } catch (e) {
    return { sent: false, channel: "webhook", reason: String(e) };
  }
}
