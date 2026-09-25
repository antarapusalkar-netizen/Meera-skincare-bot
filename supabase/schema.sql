create extension if not exists pgcrypto;

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  telegram_chat_id bigint not null,
  telegram_message_id bigint not null,
  raw_text text not null,
  score numeric,
  score_reason text,
  news_angle text,
  status text not null default 'pending', -- pending | rejected | drafted
  created_at timestamptz not null default now()
);

create table if not exists drafts (
  id uuid primary key default gen_random_uuid(),
  note_id uuid references notes(id) on delete cascade,
  draft_text text not null,
  telegram_message_id bigint unique, -- message id of the draft sent to telegram; APPROVE/REJECT replies match against this
  status text not null default 'pending', -- pending | approved | rejected
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists voice_skill (
  id uuid primary key default gen_random_uuid(),
  name text not null unique default 'default',
  content text not null,
  updated_at timestamptz not null default now()
);

insert into voice_skill (name, content)
values (
  'default',
  'Direct, specific, no corporate hedging. Short sentences. First person. Prefers a concrete detail or number over a generic claim. No hashtags, no emoji, no "excited to announce".'
)
on conflict (name) do nothing;

create index if not exists notes_status_idx on notes (status);
create index if not exists drafts_telegram_message_id_idx on drafts (telegram_message_id);
