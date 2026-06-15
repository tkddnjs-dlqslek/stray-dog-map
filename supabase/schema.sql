-- 멍플래너 Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.
-- 서버는 SERVICE_ROLE 키로 접속하므로 RLS를 우회합니다(서버 전용 키, 절대 클라이언트 노출 금지).

create table if not exists slot_overrides (
  shelter_id text primary key,
  slots jsonb not null default '[]'::jsonb
);

create table if not exists notify_configs (
  shelter_id text primary key,
  config jsonb not null default '{}'::jsonb
);

create table if not exists registered_shelters (
  id text primary key,
  status text not null default 'pending',
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_registered_status on registered_shelters (status);

create table if not exists bookings (
  id text primary key,
  shelter_id text not null,
  slot_id text not null,
  date text not null,
  name text not null,
  phone text not null,
  people int not null check (people > 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_bookings_lookup on bookings (shelter_id, date);

-- 권장: 모든 테이블 RLS 활성화(서비스 롤은 우회). anon/authenticated 직접 접근 차단.
alter table slot_overrides enable row level security;
alter table notify_configs enable row level security;
alter table registered_shelters enable row level security;
alter table bookings enable row level security;
