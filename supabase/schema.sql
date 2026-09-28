-- ROMGOL88 STAGE 03
-- Jalankan setelah schema Stage 02 (clubs/auth) sudah ada.

create table if not exists public.players (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 position text not null check(position in ('GK','LB','CB','RB','DM','CM','AM','LM','RM','LW','RW','ST')),
 age integer not null check(age between 16 and 45),
 overall integer not null check(overall between 1 and 99),
 pace integer not null default 60,
 shooting integer not null default 60,
 passing integer not null default 60,
 defending integer not null default 60,
 physical integer not null default 60,
 market_value bigint not null default 1000000,
 created_at timestamptz not null default now()
);

create table if not exists public.club_squad (
 id uuid primary key default gen_random_uuid(),
 club_id uuid not null references public.clubs(id) on delete cascade,
 player_id uuid not null references public.players(id) on delete cascade,
 shirt_number integer,
 role text not null default 'BENCH' check(role in ('STARTER','BENCH')),
 formation_slot text,
 fitness integer not null default 100 check(fitness between 0 and 100),
 morale integer not null default 75 check(morale between 0 and 100),
 created_at timestamptz not null default now(),
 unique(club_id,player_id)
);

alter table public.players enable row level security;
alter table public.club_squad enable row level security;

drop policy if exists "Players visible to authenticated users" on public.players;
create policy "Players visible to authenticated users" on public.players for select to authenticated using (true);

drop policy if exists "Own squad select" on public.club_squad;
create policy "Own squad select" on public.club_squad for select using (
 exists(select 1 from public.clubs c where c.id=club_id and c.user_id=auth.uid())
);
drop policy if exists "Own squad insert" on public.club_squad;
create policy "Own squad insert" on public.club_squad for insert with check (
 exists(select 1 from public.clubs c where c.id=club_id and c.user_id=auth.uid())
);
drop policy if exists "Own squad update" on public.club_squad;
create policy "Own squad update" on public.club_squad for update using (
 exists(select 1 from public.clubs c where c.id=club_id and c.user_id=auth.uid())
) with check (
 exists(select 1 from public.clubs c where c.id=club_id and c.user_id=auth.uid())
);
drop policy if exists "Own squad delete" on public.club_squad;
create policy "Own squad delete" on public.club_squad for delete using (
 exists(select 1 from public.clubs c where c.id=club_id and c.user_id=auth.uid())
);

insert into public.players(name,position,age,overall,pace,shooting,passing,defending,physical,market_value)
select * from (values
('Raka Pratama','GK',24,73,55,25,58,18,70,4500000),
('Dimas Arya','GK',21,68,52,20,55,15,65,2200000),
('Fajar Nugroho','LB',23,69,78,38,64,68,72,3500000),
('Bagas Ramadhan','CB',27,74,62,30,65,78,80,5200000),
('Rizky Maulana','CB',25,72,58,28,62,76,78,4700000),
('Ilham Saputra','RB',22,70,81,35,67,70,73,3900000),
('Ardiansyah Putra','DM',26,73,65,48,76,73,79,5000000),
('Rafi Hidayat','CM',24,75,69,58,82,55,71,6500000),
('Yoga Firmansyah','AM',23,77,76,72,84,38,68,8000000),
('Kevin Ramli','LW',22,76,88,68,73,30,66,7800000),
('Andika Wijaya','RW',25,74,85,70,75,32,71,6500000),
('Rangga Surya','ST',26,79,82,86,62,22,82,9500000),
('Bima Aditya','ST',20,70,79,73,54,20,68,3200000),
('Nanda Kurniawan','CM',28,69,61,48,72,57,76,2800000),
('Dion Setiawan','CB',29,67,55,25,57,72,77,2100000)
) v(name,position,age,overall,pace,shooting,passing,defending,physical,market_value)
where not exists(select 1 from public.players p where p.name=v.name);

-- Memberi skuad awal kepada klub yang sudah ada tetapi belum punya pemain.
insert into public.club_squad(club_id,player_id,shirt_number,role,formation_slot)
select c.id,p.id,
 case p.name when 'Raka Pratama' then 1 when 'Fajar Nugroho' then 3 when 'Bagas Ramadhan' then 4
 when 'Rizky Maulana' then 5 when 'Ilham Saputra' then 2 when 'Ardiansyah Putra' then 6
 when 'Rafi Hidayat' then 8 when 'Yoga Firmansyah' then 10 when 'Kevin Ramli' then 11
 when 'Andika Wijaya' then 7 when 'Rangga Surya' then 9 when 'Dimas Arya' then 12
 when 'Bima Aditya' then 18 when 'Nanda Kurniawan' then 14 when 'Dion Setiawan' then 15 end,
 case when p.name in ('Raka Pratama','Fajar Nugroho','Bagas Ramadhan','Rizky Maulana','Ilham Saputra','Ardiansyah Putra','Rafi Hidayat','Yoga Firmansyah','Kevin Ramli','Andika Wijaya','Rangga Surya') then 'STARTER' else 'BENCH' end,
 case p.name when 'Raka Pratama' then 'GK' when 'Fajar Nugroho' then 'LB' when 'Bagas Ramadhan' then 'CB'
 when 'Rizky Maulana' then 'CB' when 'Ilham Saputra' then 'RB' when 'Ardiansyah Putra' then 'DM'
 when 'Rafi Hidayat' then 'CM' when 'Yoga Firmansyah' then 'AM' when 'Kevin Ramli' then 'LW'
 when 'Andika Wijaya' then 'RW' when 'Rangga Surya' then 'ST' else null end
from public.clubs c cross join public.players p
where p.name in ('Raka Pratama','Dimas Arya','Fajar Nugroho','Bagas Ramadhan','Rizky Maulana','Ilham Saputra','Ardiansyah Putra','Rafi Hidayat','Yoga Firmansyah','Kevin Ramli','Andika Wijaya','Rangga Surya','Bima Aditya','Nanda Kurniawan','Dion Setiawan')
and not exists(select 1 from public.club_squad s where s.club_id=c.id);


-- STAGE 04 TRANSFER MARKET
alter table public.players add column if not exists club_status text not null default 'MARKET';
create table if not exists public.transfers(
 id uuid primary key default gen_random_uuid(),
 club_id uuid not null references public.clubs(id) on delete cascade,
 player_id uuid not null references public.players(id) on delete cascade,
 fee bigint not null, created_at timestamptz not null default now()
);
alter table public.transfers enable row level security;
drop policy if exists "Own transfers select" on public.transfers;
create policy "Own transfers select" on public.transfers for select using(exists(select 1 from public.clubs c where c.id=club_id and c.user_id=auth.uid()));
drop policy if exists "Own transfers insert" on public.transfers;
create policy "Own transfers insert" on public.transfers for insert with check(exists(select 1 from public.clubs c where c.id=club_id and c.user_id=auth.uid()));

update public.players p set club_status='OWNED'
where exists(select 1 from public.club_squad s where s.player_id=p.id);

insert into public.players(name,position,age,overall,pace,shooting,passing,defending,physical,market_value,club_status)
select * from (values
('Marco Bellini','ST',24,78,84,88,66,24,79,9000000,'MARKET'),
('Diego Alvarez','LW',23,77,91,75,78,29,70,8500000,'MARKET'),
('Kenji Sato','RW',22,76,89,72,81,35,68,8200000,'MARKET'),
('Lucas Moreira','AM',25,79,79,77,88,40,72,10500000,'MARKET'),
('Anton Petrov','CM',27,75,68,55,86,62,78,7000000,'MARKET'),
('Milan Kovac','DM',26,76,64,42,78,82,85,7600000,'MARKET'),
('Noah Mensah','CB',24,77,72,29,66,86,88,8800000,'MARKET'),
('Tomas Silva','RB',21,74,87,38,73,74,76,6500000,'MARKET'),
('Rafael Costa','LB',25,73,85,35,70,76,74,6100000,'MARKET'),
('Ethan Cole','GK',23,75,58,22,63,20,79,6800000,'MARKET'),
('Jamal Okoro','ST',20,74,90,81,58,21,76,7200000,'MARKET'),
('Min-jun Park','CM',21,72,77,52,79,54,69,5200000,'MARKET')
)v(name,position,age,overall,pace,shooting,passing,defending,physical,market_value,club_status)
where not exists(select 1 from public.players p where p.name=v.name);


-- ROMGOL88 STAGE 05: MATCH ENGINE
create table if not exists public.matches(
 id uuid primary key default gen_random_uuid(),
 club_id uuid not null references public.clubs(id) on delete cascade,
 opponent_name text not null,
 opponent_rating integer not null check(opponent_rating between 1 and 99),
 club_score integer not null default 0 check(club_score between 0 and 20),
 opponent_score integer not null default 0 check(opponent_score between 0 and 20),
 result text not null check(result in ('WIN','DRAW','LOSS')),
 shots integer not null default 0,
 shots_on_target integer not null default 0,
 possession integer not null default 50 check(possession between 0 and 100),
 cards integer not null default 0,
 reward_cash bigint not null default 0,
 reward_coins integer not null default 0,
 played_at timestamptz not null default now()
);

alter table public.matches enable row level security;
drop policy if exists "Own matches select" on public.matches;
create policy "Own matches select" on public.matches for select using(
 exists(select 1 from public.clubs c where c.id=club_id and c.user_id=auth.uid())
);
drop policy if exists "Own matches insert" on public.matches;
create policy "Own matches insert" on public.matches for insert with check(
 exists(select 1 from public.clubs c where c.id=club_id and c.user_id=auth.uid())
);


-- ROMGOL88 STAGE 06: TRAINING
alter table public.players add column if not exists energy integer not null default 100;
alter table public.players add column if not exists training_xp integer not null default 0;

create table if not exists public.training_history(
 id uuid primary key default gen_random_uuid(),
 club_id uuid not null references public.clubs(id) on delete cascade,
 player_id uuid not null references public.players(id) on delete cascade,
 drill text not null,
 xp_gained integer not null default 0,
 energy_used integer not null default 0,
 attribute text not null,
 attribute_gain integer not null default 0,
 created_at timestamptz not null default now()
);
alter table public.training_history enable row level security;
drop policy if exists "Own training history select" on public.training_history;
create policy "Own training history select" on public.training_history for select using(exists(select 1 from public.clubs c where c.id=club_id and c.user_id=auth.uid()));
drop policy if exists "Own training history insert" on public.training_history;
create policy "Own training history insert" on public.training_history for insert with check(exists(select 1 from public.clubs c where c.id=club_id and c.user_id=auth.uid()));
