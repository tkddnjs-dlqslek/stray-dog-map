# 🐾 멍플래너 — 전국 유기견 보호소 봉사 지도

지도에서 근처 유기견 보호소를 찾고, **빈 시간대를 한눈에 보고 바로 봉사 신청**하는 웹앱.
1365에 흩어진 정보와 SNS로만 모집하던 **사설보호소**까지 한 곳에 모읍니다.

## 왜 만들었나 (1365와의 차이)

`1365 자원봉사포털`로도 유기견 봉사를 일부 신청할 수 있고, **봉사시간 공식 인증**이 가능합니다.
하지만 1365는,

- 범용 포털이라 **펫 특화가 아니고**, 지도 기반 탐색이 안 됩니다.
- **사설보호소(소규모 개인 운영)는 대부분 미등록** — 정작 일손이 급한 곳이 안 보입니다.
- 보호소별 **요일·시간대 빈자리를 한눈에 비교**할 수 없습니다.

그래서 이 서비스는 **1365를 대체하지 않고 보완**합니다 (하이브리드).

| 신청 방식 | 대상 | 동작 |
|---|---|---|
| `link1365` | 공공/등록 보호소 | 1365 모집글로 딥링크 연결 (봉사시간 인증은 1365가 처리) |
| `linkExternal` | 사설보호소 | 보호소 자체 채널(네이버폼/오픈카톡 등)로 연결 → 신청이 그쪽으로 바로 접수 |
| `self` | 사설보호소 | 멍플래너 자체 타임테이블로 직접 예약 (정원 관리 + 보호소 알림) |

### "예약하면 보호소에 실제로 연락이 가나?"

- **그쪽 시스템에 자동으로 예약을 써넣는 양방향 연동은 불가**합니다. 사설보호소는 예약 시스템이
  없고, 1365도 외부 쓰기 API가 없어요(상대가 API를 줘야만 가능).
- 대신 **알림(notify)** 으로 해결합니다. `self` 보호소가 운영자 콘솔에서 **웹훅 URL**(Discord/Slack 등)을
  등록해두면, 예약 완료 시 `src/lib/notify.ts`가 신청 내역을 그 채널로 POST합니다. 우리 콘솔이 곧
  그 보호소의 예약 장부 역할을 합니다.
- 같은 패턴으로 이메일·문자(SMS)·카카오 알림톡으로 확장 가능 (provider 키/온보딩 필요).
- 보호소별 웹훅이 없으면 `NOTIFY_WEBHOOK_DEFAULT` 환경변수를 폴백으로 사용. 알림 실패는
  best-effort라 예약 자체는 항상 확정됩니다.

## 기능

- 🗺️ **지도 탐색** — 전국 보호소를 OpenStreetMap 위에 핀으로 표시 (공공=파랑, 사설=초록)
- 🔎 **지역 필터** — 시/도 카테고리 + 신청방식(자체예약/1365) 필터, 선택 시 지도 자동 재정렬
- 🗓️ **타임테이블 예약** — 요일·시간대 슬롯 선택 → 신청 가능한 날짜 자동 생성 → **정원 실시간 차감**
- ✅ **유효성 검증** — 요일 불일치, 정원 초과, 1365 보호소 직접예약 차단
- 🌐 **전국 공공 데이터 연동** — 동물보호관리시스템 공공 API 연결 (키 주입 시 전국 공공 보호소 자동 표시)
- 🛠️ **운영자 콘솔** (`/manage`) — 사설보호소 운영자가 봉사 타임테이블을 직접 등록·수정 → 봉사자 화면에 즉시 반영
- ➕ **보호소 자기등록** (`/register`) — 사설보호소가 직접 등록(데이터 수집의 정식 경로). 검수 승인 후 지도에 노출
- 🛡️ **등록 검수** (`/admin`) — 관리자가 자기등록을 승인/거절 (스팸·중복·허위 차단)
- 📨 **예약 알림** — 자체예약 시 보호소에 이메일/웹훅 발송 (개인정보는 알림으로만 전달)
- 🔒 **개인정보 보호** — 신청자 명단(이름·전화)은 웹에 노출하지 않음. 공개 조회는 빈자리 "집계"만 반환

## 지도 API (카카오맵 / OSM 자동 전환)

`NEXT_PUBLIC_KAKAO_MAP_KEY`가 설정돼 있으면 **카카오맵**, 없으면 **OpenStreetMap(Leaflet)**으로 자동 폴백합니다
(`src/components/ShelterMap.tsx`에서 분기). 데모는 키 없이도 OSM으로 바로 실행돼요.

**카카오맵 키 발급 (직접 하실 일):**

1. [developers.kakao.com](https://developers.kakao.com) 로그인 → **내 애플리케이션 > 애플리케이션 추가**
2. **앱 키 > JavaScript 키** 복사
3. **플랫폼 > Web > 사이트 도메인 등록** — `http://localhost:3000` (개발) + 배포 도메인
4. `.env.local`에 `NEXT_PUBLIC_KAKAO_MAP_KEY=복사한_JS키` 추가 후 `npm run dev` 재시작

**비용:** 지도 표시 + 마커는 **무료 쿼터** 안에서 무료(도메인 등록만 필요). 우리는 좌표를 이미 보유하므로
유료 대상인 주소↔좌표 변환·장소검색·길찾기 API를 쓰지 않습니다. 단 2026년부터 일부 지도/로컬 API가
건당 과금(할인가 10원→정상가 50원)으로 전환되니, 배포 전 대시보드 **[통계 > 쿼터]**에서 한도를 확인하세요.

## 기술 스택

- **Next.js 14** (App Router) + TypeScript
- **react-leaflet** + OpenStreetMap 타일 — **API 키 없이 바로 실행** (카카오/구글 맵으로 교체 가능)
- 보호소 데이터: `data/shelters.json` 시드 (추후 공공 API로 교체)
- 예약 저장: `data/bookings.json` 파일 기반 간이 저장소 (추후 DB로 교체)

## 데이터 저장소 (파일 ↔ Supabase 자동 전환)

`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`가 설정되면 **Supabase(Postgres)**, 없으면 파일(`DATA_DIR`)에
저장합니다 (`src/lib/storage`). 백엔드 추상화라 라우트 코드는 동일.

**Supabase 설정:**
1. [supabase.com](https://supabase.com) 프로젝트 생성
2. **SQL Editor**에 `supabase/schema.sql` 붙여넣고 실행 (테이블 4개 생성)
3. **Project Settings > API**에서 `Project URL` → `SUPABASE_URL`, `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY`
   (⚠️ service_role 키는 **서버 전용**, 절대 클라이언트/`NEXT_PUBLIC_`에 넣지 마세요)
4. 환경변수 설정 후 재시작 → 예약·등록·검수·슬롯이 전부 DB에 영속

## 배포

이 앱은 API 라우트·동적 렌더링을 쓰므로 **Node 호스트**가 필요합니다(정적 export 불가).
데이터는 Supabase(설정 시) 또는 `DATA_DIR` 파일에 저장됩니다.

### A. Vercel + Supabase (권장 — 영속성 OK)
1. GitHub 저장소를 [Vercel](https://vercel.com/new)에서 **Import** (Next.js 자동 인식, 빌드 설정 불필요)
2. 환경변수: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_TOKEN`, (선택) `ANIMAL_SERVICE_KEY`, `SMTP_*`
3. Deploy. → Supabase에 데이터가 영속되므로 서버리스 휘발 문제 없음.
   - Supabase 없이 띄우려면 `DATA_DIR=/tmp/data` (단, `/tmp`는 인스턴스마다 휘발 — 데모용).
   - CI 자동배포: `.github/workflows/deploy.yml` (시크릿 `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`
     등록 시 main push마다 배포, 없으면 skip).

### B. Docker (영속 볼륨 — 권장)
```bash
docker build -t mung-planner .
docker run -p 3000:3000 -v mung-data:/data \
  -e ADMIN_TOKEN=changeme -e ANIMAL_SERVICE_KEY=... mung-planner
```
`output: "standalone"`로 최소 이미지를 만들고, `/data` 볼륨에 데이터를 영속화합니다.
Render/Railway/Fly.io 등 컨테이너 호스트에 그대로 올릴 수 있어요.

> 검증: 프로덕션 standalone 산출물(`.next/standalone/server.js`)을 외부 `DATA_DIR`로 기동해
> 홈/등록(write)/검수까지 동작하고 데이터가 외부 경로에 영속됨을 확인했습니다.

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
# 또는
npm run build && npm start
```

### 환경변수 (선택)

```bash
# 동물보호관리시스템 공공 API 서비스키 (data.go.kr 발급). 없으면 시드 데이터만 사용.
ANIMAL_SERVICE_KEY=발급받은_디코딩_서비스키
```

키를 주입하면 전국 17개 시/도의 **공공 보호소가 자동으로 합쳐져** 지도에 표시됩니다
(공공 보호소는 `link1365`로 처리). 키가 없으면 `data/shelters.json` 시드로 폴백합니다.

## 데이터 모델

`src/lib/types.ts` 참고. 핵심은 `Shelter.applyMethod` (`self` | `link1365`)와 `Shelter.region`.

## 전국 실데이터 연동 (구현됨)

`src/lib/animalApi.ts`가 **동물보호관리시스템 공공 API**(`apis.data.go.kr/1543061/animalShelterSrvc_v2`)를
17개 시/도 코드로 조회해 우리 `Shelter` 모델로 변환합니다.

- 좌표가 응답에 없으면 시/도 중심좌표 + 이름 기반 결정적 흔들림으로 배치 (마커 겹침 방지).
  운영에선 **카카오 Local API 지오코딩**으로 교체 권장.
- 일부 시/도 호출이 실패해도 `Promise.allSettled`로 나머지는 표시.
- 자체예약 슬롯은 공공 API와 별개로 `data/slots.json`에 저장 — 이게 1365가 못 하는 영역.

## 실데이터 수집 & 등록

진짜 사설보호소는 공개 데이터셋이 없어 **스크래핑이 아니라 등록(자기등록 + 큐레이션)으로 수집**합니다.

- **자기등록** (`/register` → `POST /api/shelters/register`): 보호소가 이름·지역·주소·연락처·알림 이메일을
  입력하면 `data/registered.json`에 **검수 대기(pending)** 상태로 저장됩니다. (`source: "community"`)
  좌표 미입력 시 시/도 중심좌표로 배치(`src/lib/regions.ts`) — 운영 시 지오코딩으로 교체 권장.
- **검수(moderation)** (`/admin` → `/api/moderation`): 관리자가 대기 목록을 확인하고 **승인**하면 지도에
  노출, **거절**하면 숨김. 승인된 보호소만 공개 데이터에 합류합니다. `ADMIN_TOKEN` 설정 시 `x-admin-token`
  헤더 필요(미설정 시 MVP로 열림).
- **벌크 임포트**: 직접 조사한 보호소 목록을 `data/registered.json` 배열(= `Shelter[]`, `status:"approved"`)에
  그대로 넣으면 됩니다.

### 공공 보호소 실연동 (약 228개소)

`ANIMAL_SERVICE_KEY`(data.go.kr) 주입 시 `src/lib/animalApi.ts`가 17개 시/도를 조회해 우리 모델로 변환,
지도에 합류합니다(`source:"public"`, `link1365` 방식). 페이지네이션·`resultCode` 오류 처리 포함.

- **연동 상태 확인**: `GET /api/public/status`(관리자) → 키 유무, 지역별 수집 수, 오류를 반환.
- 좌표 미제공 시 시/도 중심좌표로 배치(운영 시 카카오 Local API 지오코딩 권장).
- 자체예약 슬롯은 공공 데이터와 별개로 `data/slots.json`에 저장 — 이게 1365가 못 하는 영역.

## 개인정보(PII) 정책

- 신청자의 이름·전화는 **웹 어디에도 노출하지 않습니다.** `GET /api/bookings`는 슬롯별 예약 인원
  **집계만** 반환(`{ counts }`). 보호소는 예약 시 **이메일/웹훅 알림**으로만 신청자 상세를 받습니다.
- 덕분에 별도 로그인/권한 없이도 개인정보 노출 위험이 없습니다. (웹 신청자 명단 페이지는 의도적으로 미구현)

## 다음 단계 후보

- 카카오맵 전환 + 현재 위치 기반 "내 근처" 정렬 + 주소 지오코딩
- 예약 취소 / 내 신청 내역, 운영자 알림(예약 들어오면 통보)
- 운영자 콘솔 인증(지금은 데모라 누구나 접근)
- 입양 통합검색·실종견 찾기 모듈 (포인핸드/펫나우 레퍼런스)
- 예약/슬롯 저장소를 파일 → DB(Postgres 등)로 이전
