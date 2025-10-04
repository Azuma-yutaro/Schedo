-- アンケートテーブル
create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 日程候補テーブル
create table if not exists public.survey_dates (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  date_value date not null,
  created_at timestamp with time zone default now()
);

-- 回答テーブル
create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  respondent_name text not null,
  cookie_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 回答詳細テーブル（各日程に対する回答）
create table if not exists public.response_details (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.responses(id) on delete cascade,
  survey_date_id uuid not null references public.survey_dates(id) on delete cascade,
  availability text not null check (availability in ('available', 'maybe', 'unavailable')),
  note text,
  created_at timestamp with time zone default now()
);

-- インデックスの作成
create index if not exists idx_survey_dates_survey_id on public.survey_dates(survey_id);
create index if not exists idx_responses_survey_id on public.responses(survey_id);
create index if not exists idx_responses_cookie_id on public.responses(cookie_id);
create index if not exists idx_response_details_response_id on public.response_details(response_id);
create index if not exists idx_response_details_survey_date_id on public.response_details(survey_date_id);

-- RLSを有効化（認証なしで誰でもアクセス可能）
alter table public.surveys enable row level security;
alter table public.survey_dates enable row level security;
alter table public.responses enable row level security;
alter table public.response_details enable row level security;

-- 全員が読み取り可能
create policy "surveys_select_all" on public.surveys for select using (true);
create policy "survey_dates_select_all" on public.survey_dates for select using (true);
create policy "responses_select_all" on public.responses for select using (true);
create policy "response_details_select_all" on public.response_details for select using (true);

-- 全員が挿入可能
create policy "surveys_insert_all" on public.surveys for insert with check (true);
create policy "survey_dates_insert_all" on public.survey_dates for insert with check (true);
create policy "responses_insert_all" on public.responses for insert with check (true);
create policy "response_details_insert_all" on public.response_details for insert with check (true);

-- 全員が更新可能
create policy "surveys_update_all" on public.surveys for update using (true);
create policy "survey_dates_update_all" on public.survey_dates for update using (true);
create policy "responses_update_all" on public.responses for update using (true);
create policy "response_details_update_all" on public.response_details for update using (true);

-- 全員が削除可能
create policy "surveys_delete_all" on public.surveys for delete using (true);
create policy "survey_dates_delete_all" on public.survey_dates for delete using (true);
create policy "responses_delete_all" on public.responses for delete using (true);
create policy "response_details_delete_all" on public.response_details for delete using (true);
