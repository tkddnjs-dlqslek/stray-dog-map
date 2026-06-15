import nodemailer from "nodemailer";
import type { Booking, Shelter, TimeSlot } from "./types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface ChannelResult {
  sent: boolean;
  status?: number;
  reason?: string;
}

export interface NotifyResult {
  /** 한 채널이라도 성공하면 true */
  sent: boolean;
  webhook?: ChannelResult;
  email?: ChannelResult;
}

function buildMessage(shelter: Shelter, slot: TimeSlot, booking: Booking) {
  const day = WEEKDAYS[new Date(`${booking.date}T00:00:00`).getDay()];
  return (
    `🐾 새 봉사 신청이 들어왔어요\n` +
    `· 보호소: ${shelter.name}\n` +
    `· 일시: ${booking.date}(${day}) ${slot.start}~${slot.end} — ${slot.label}\n` +
    `· 신청자: ${booking.name} (${booking.phone}) / ${booking.people}명`
  );
}

async function sendWebhook(url: string, message: string, booking: Booking, slot: TimeSlot, shelterId: string): Promise<ChannelResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message, text: message, type: "booking.created", shelterId, booking, slot }),
    });
    return { sent: res.ok, status: res.status };
  } catch (e) {
    return { sent: false, reason: String(e) };
  }
}

// SMTP 설정(환경변수)이 있을 때만 전송. provider 무관(Gmail/Naver/SES 등 SMTP면 OK).
function getTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
    // 자체 서명 인증서를 쓰는 사내/테스트 SMTP 허용 (기본은 검증 ON)
    tls: { rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false" },
  });
}

async function sendEmail(to: string, message: string, shelter: Shelter): Promise<ChannelResult> {
  const transport = getTransport();
  if (!transport) return { sent: false, reason: "no-smtp-config" };
  try {
    await transport.sendMail({
      from: process.env.NOTIFY_EMAIL_FROM ?? "멍플래너 <no-reply@mungplanner.kr>",
      to,
      subject: `[멍플래너] ${shelter.name} 새 봉사 신청`,
      text: message,
    });
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: String(e) };
  }
}

/**
 * 예약 완료 시 보호소에 알림을 보낸다. (best-effort — 실패해도 예약은 유지)
 * 채널: 이메일(SMTP) + 웹훅. 보호소별 설정(shelter.notify) 우선, 없으면 환경변수 폴백.
 */
export async function notifyShelter(
  shelter: Shelter,
  slot: TimeSlot,
  booking: Booking
): Promise<NotifyResult> {
  const message = buildMessage(shelter, slot, booking);
  const result: NotifyResult = { sent: false };

  const email = shelter.notify?.email || process.env.NOTIFY_EMAIL_TO_DEFAULT;
  if (email) {
    result.email = await sendEmail(email, message, shelter);
    if (result.email.sent) result.sent = true;
  }

  const webhook = shelter.notify?.webhook || process.env.NOTIFY_WEBHOOK_DEFAULT;
  if (webhook) {
    result.webhook = await sendWebhook(webhook, message, booking, slot, shelter.id);
    if (result.webhook.sent) result.sent = true;
  }

  return result;
}
