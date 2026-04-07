create extension if not exists pgcrypto;

create table if not exists public.style_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null default '',
  edit_summary text not null default '',
  style_rules jsonb not null default '[]'::jsonb,
  banned_tone jsonb not null default '[]'::jsonb,
  winning_touches jsonb not null default '[]'::jsonb,
  ai_draft text not null default '',
  qc_final text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists style_memories_user_id_created_at_idx
  on public.style_memories (user_id, created_at desc);

alter table public.style_memories enable row level security;

create policy "Users can read own style memories"
on public.style_memories
for select
using (auth.uid() = user_id);

create policy "Users can insert own style memories"
on public.style_memories
for insert
with check (auth.uid() = user_id);

create policy "Users can update own style memories"
on public.style_memories
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own style memories"
on public.style_memories
for delete
using (auth.uid() = user_id);
