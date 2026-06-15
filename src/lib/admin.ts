import type { NextRequest } from "next/server";

/**
 * 관리자 인증 — ADMIN_TOKEN 환경변수가 설정돼 있으면 x-admin-token 헤더와 일치해야 한다.
 * 미설정 시에는 열려 있음(MVP). 운영 배포 전 반드시 ADMIN_TOKEN을 설정할 것.
 */
export function isAdminAuthed(req: NextRequest): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return true; // MVP: 토큰 미설정이면 통과
  return req.headers.get("x-admin-token") === expected;
}
