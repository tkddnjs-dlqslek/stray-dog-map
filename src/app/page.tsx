import ShelterExplorer from "@/components/ShelterExplorer";
import { getShelters } from "@/lib/store";

export default function HomePage() {
  const shelters = getShelters();

  return (
    <main className="container">
      <section className="hero">
        <h1>전국 유기견 보호소, 지도에서 바로 봉사 신청</h1>
        <p>
          1365에 흩어진 정보와 SNS로만 모집하던 사설보호소를 한 곳에. 지역을 고르고, 빈 시간대를
          한눈에 보고 신청하세요.
        </p>
      </section>

      <ShelterExplorer shelters={shelters} />
    </main>
  );
}
