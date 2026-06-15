import Link from "next/link";
import SlotManager from "@/components/SlotManager";
import { getLocalShelters } from "@/lib/store";

export const metadata = { title: "운영자 콘솔 — 멍플래너" };
export const dynamic = "force-dynamic";

export default async function ManagePage() {
  // 자체예약(사설) 보호소만 슬롯 관리 대상
  const shelters = (await getLocalShelters()).filter((s) => s.applyMethod === "self");

  return (
    <main className="container">
      <Link href="/" className="back-link">
        ← 지도로 돌아가기
      </Link>
      <section className="hero">
        <h1>운영자 콘솔 · 봉사 시간대 관리</h1>
        <p>
          사설보호소 운영자가 봉사 타임테이블을 직접 등록·수정하는 곳입니다. 여기서 만든 슬롯이
          봉사자에게 바로 노출돼요. (1365가 못 하는 영역)
        </p>
      </section>
      <SlotManager shelters={shelters} />
    </main>
  );
}
