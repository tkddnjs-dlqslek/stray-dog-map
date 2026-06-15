import Link from "next/link";
import { notFound } from "next/navigation";
import BookingPanel from "@/components/BookingPanel";
import { getShelter } from "@/lib/store";

// 운영자 콘솔에서 수정한 슬롯·공공 API 보호소가 즉시 반영되도록 동적 렌더링
export const dynamic = "force-dynamic";

export default async function ShelterDetail({ params }: { params: { id: string } }) {
  const shelter = await getShelter(params.id);
  if (!shelter) notFound();

  return (
    <main className="container">
      <Link href="/" className="back-link">
        ← 지도로 돌아가기
      </Link>

      <div className="detail-head">
        <h1>{shelter.name}</h1>
        <span className="badge badge-region">{shelter.region}</span>
        <span className={`badge ${shelter.kind === "public" ? "badge-public" : "badge-private"}`}>
          {shelter.kind === "public" ? "공공" : "사설"}
        </span>
      </div>
      <div className="muted">
        {shelter.address}
        {shelter.phone ? ` · ${shelter.phone}` : ""}
      </div>
      <p className="desc" style={{ maxWidth: 720 }}>
        {shelter.description}
      </p>

      {shelter.applyMethod === "link1365" ? (
        <>
          <div className="notice">
            이 보호소는 <strong>1365 자원봉사포털</strong>을 통해 신청하면 <strong>봉사시간 인증</strong>
            까지 받을 수 있어요. 아래 버튼으로 1365 모집글로 이동하세요.
          </div>
          <a className="btn" href={shelter.link1365} target="_blank" rel="noopener noreferrer">
            1365에서 신청하기 →
          </a>
        </>
      ) : (
        <>
          <div className="notice">
            이곳은 1365에 등록되지 않은 <strong>사설보호소</strong>예요. 멍플래너에서 바로 시간대를
            골라 신청할 수 있습니다.
          </div>
          <BookingPanel shelter={shelter} />
        </>
      )}
    </main>
  );
}
