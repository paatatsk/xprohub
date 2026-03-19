-- ============================================================
-- XProHub — Supabase PostgreSQL Schema
-- github.com/paatatsk/xprohub
-- Run this in Supabase SQL Editor (in order)
-- ============================================================


-- ============================================================
-- 1. PROFILES
-- Extends Supabase auth.users. One row per user.
-- Handles both customer and worker modes.
-- ============================================================
create table public.profiles (
  id                  uuid references auth.users(id) on delete cascade primary key,
  full_name           text,
  email               text,
  phone               text,
  avatar_url          text,
  role                text default 'customer' check (role in ('customer', 'worker', 'both')),
  bio                 text,

  -- Belt & XP system
  belt_level          text default 'white' check (belt_level in ('white','yellow','orange','green','blue','purple','brown','black')),
  xp_total            integer default 0,
  xp_level            integer default 1,
  level_name          text default 'Newcomer',

  -- Stats
  rating_avg          numeric(3,2) default 0,
  jobs_completed      integer default 0,
  jobs_posted         integer default 0,
  total_earned        numeric(10,2) default 0,
  total_spent         numeric(10,2) default 0,

  -- Verification
  is_verified         boolean default false,
  is_insured          boolean default false,
  is_background_checked boolean default false,

  -- Location
  location_lat        numeric,
  location_lng        numeric,
  location_address    text,
  neighborhood        text,
  city                text default 'New York',
  state               text default 'NY',

  -- Stripe (payments)
  stripe_customer_id  text unique,     -- for making payments
  stripe_account_id   text unique,     -- for receiving payouts (workers)

  -- Insurance tier
  insurance_tier      text default 'basic' check (insurance_tier in ('basic','standard','premium')),

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 2. SKILLS LIBRARY
-- The 17 categories (Tier 1 everyday + Tier 2 skilled trades)
-- ============================================================
create table public.skills (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null,
  tier        integer check (tier in (1, 2)),
  icon        text,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- Seed: Tier 1 (everyday tasks)
insert into public.skills (name, category, tier) values
  ('Home Cleaning', 'Home', 1),
  ('Errands & Delivery', 'Errands', 1),
  ('Pet Care', 'Pets', 1),
  ('Child Care', 'Care', 1),
  ('Elder Care', 'Care', 1),
  ('Moving & Labor', 'Moving', 1),
  ('Tutoring & Education', 'Education', 1),
  ('Personal Assistance', 'Admin', 1),
  ('Vehicle Care', 'Vehicles', 1),
  ('Sports & Physical Training', 'Fitness', 1),
  ('Catering & Food Services', 'Food', 1),
  ('Entertainment', 'Events', 1);

-- Seed: Tier 2 (skilled trades)
insert into public.skills (name, category, tier) values
  ('Electrical', 'Trades', 2),
  ('Plumbing', 'Trades', 2),
  ('Painting', 'Trades', 2),
  ('Carpentry', 'Trades', 2),
  ('IT & Tech Support', 'Tech', 2),
  ('HVAC', 'Trades', 2);


-- ============================================================
-- 3. USER SKILLS (junction)
-- Which skills each worker has
-- ============================================================
create table public.user_skills (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade,
  skill_id          uuid references public.skills(id),
  years_experience  integer default 0,
  is_primary        boolean default false,
  created_at        timestamptz default now(),
  unique(user_id, skill_id)
);


-- ============================================================
-- 4. JOBS
-- Posted by customers. Matched to workers.
-- ============================================================
create table public.jobs (
  id                        uuid primary key default gen_random_uuid(),
  customer_id               uuid references public.profiles(id),
  worker_id                 uuid references public.profiles(id),
  skill_id                  uuid references public.skills(id),

  -- Job details
  title                     text not null,
  description               text,
  category                  text,
  budget_min                numeric(10,2),
  budget_max                numeric(10,2),
  agreed_price              numeric(10,2),

  -- Status lifecycle: open -> matched -> in_progress -> completed / cancelled
  status                    text default 'open' check (
    status in ('open','matched','in_progress','completed','cancelled','expired')
  ),

  -- Timing
  timing                    text check (timing in ('asap','scheduled','flexible')),
  scheduled_at              timestamptz,
  completed_at              timestamptz,

  -- Location
  location_lat              numeric,
  location_lng              numeric,
  location_address          text,
  neighborhood              text,

  -- Media
  photos                    text[],

  -- Live Market signals
  watcher_count             integer default 0,
  is_urgent                 boolean default false,
  requires_background_check boolean default false,

  -- Squad support (future)
  squad_id                  uuid,
  is_squad_job              boolean default false,

  expires_at                timestamptz default (now() + interval '7 days'),
  created_at                timestamptz default now(),
  updated_at                timestamptz default now()
);

create trigger jobs_updated_at
  before update on public.jobs
  for each row execute function public.handle_updated_at();

-- Enable Realtime on jobs (for Live Market)
alter publication supabase_realtime add table public.jobs;


-- ============================================================
-- 5. BIDS
-- Worker applications to jobs. Stores the match score.
-- ============================================================
create table public.bids (
  id                  uuid primary key default gen_random_uuid(),
  job_id              uuid references public.jobs(id) on delete cascade,
  worker_id           uuid references public.profiles(id),
  proposed_price      numeric(10,2),
  message             text,
  estimated_duration  text,

  -- The Match Score % (from your 4-factor algorithm)
  match_score         numeric(5,2),
  match_reasons       text[],

  -- Bid lifecycle
  status              text default 'pending' check (
    status in ('pending','accepted','declined','withdrawn')
  ),

  created_at          timestamptz default now(),
  unique(job_id, worker_id)
);


-- ============================================================
-- 6. CHATS
-- One chat room per job. Links customer and worker.
-- ============================================================
create table public.chats (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid references public.jobs(id) on delete cascade unique,
  customer_id       uuid references public.profiles(id),
  worker_id         uuid references public.profiles(id),
  last_message      text,
  last_message_at   timestamptz,
  created_at        timestamptz default now()
);


-- ============================================================
-- 7. MESSAGES
-- Real-time messages within a chat.
-- ============================================================
create table public.messages (
  id            uuid primary key default gen_random_uuid(),
  chat_id       uuid references public.chats(id) on delete cascade,
  sender_id     uuid references public.profiles(id),
  content       text,
  message_type  text default 'text' check (
    message_type in ('text','image','job_card','payment_request','system')
  ),
  is_read       boolean default false,
  created_at    timestamptz default now()
);

-- Enable Realtime on messages (for Chat screen)
alter publication supabase_realtime add table public.messages;


-- ============================================================
-- 8. PAYMENTS / ESCROW
-- Stripe escrow: funds held until job completion.
-- ============================================================
create table public.payments (
  id                        uuid primary key default gen_random_uuid(),
  job_id                    uuid references public.jobs(id),
  customer_id               uuid references public.profiles(id),
  worker_id                 uuid references public.profiles(id),

  -- Money
  amount                    numeric(10,2) not null,
  platform_fee              numeric(10,2),
  worker_payout             numeric(10,2),

  -- Stripe
  stripe_payment_intent_id  text unique,
  stripe_transfer_id        text unique,

  -- Escrow lifecycle
  escrow_status             text default 'held' check (
    escrow_status in ('pending','held','released','refunded','disputed')
  ),

  -- Insurance
  insurance_tier            text check (insurance_tier in ('basic','standard','premium')),
  insurance_cost            numeric(10,2) default 0,
  coverage_amount           numeric(10,2),

  released_at               timestamptz,
  refunded_at               timestamptz,
  created_at                timestamptz default now()
);


-- ============================================================
-- 9. REVIEWS
-- Star ratings after job completion. Both directions.
-- ============================================================
create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid references public.jobs(id),
  reviewer_id   uuid references public.profiles(id),
  reviewee_id   uuid references public.profiles(id),
  rating        integer check (rating between 1 and 5),
  comment       text,
  tags          text[],
  xp_awarded    integer default 0,
  created_at    timestamptz default now(),
  unique(job_id, reviewer_id)
);

-- Update profile rating_avg after each review
create or replace function public.update_profile_rating()
returns trigger as $$
begin
  update public.profiles
  set rating_avg = (
    select round(avg(rating)::numeric, 2)
    from public.reviews
    where reviewee_id = new.reviewee_id
  )
  where id = new.reviewee_id;
  return new;
end;
$$ language plpgsql;

create trigger after_review_insert
  after insert on public.reviews
  for each row execute function public.update_profile_rating();


-- ============================================================
-- 10. XP TRANSACTIONS
-- Every XP event logged here. Profile xp_total updated via trigger.
-- ============================================================
create table public.xp_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id),
  job_id      uuid references public.jobs(id),
  amount      integer not null,
  reason      text check (reason in (
    'job_completed',
    'five_star_review',
    'fast_response',
    'on_time',
    'repeat_customer',
    'left_review',
    'referred_worker',
    'newcomer_bonus',
    'admin_adjustment'
  )),
  created_at  timestamptz default now()
);

-- Auto-update xp_total on profile
create or replace function public.update_profile_xp()
returns trigger as $$
begin
  update public.profiles
  set xp_total = xp_total + new.amount
  where id = new.user_id;
  return new;
end;
$$ language plpgsql;

create trigger after_xp_insert
  after insert on public.xp_transactions
  for each row execute function public.update_profile_xp();


-- ============================================================
-- 11. BADGES
-- The 9 XProHub badges
-- ============================================================
create table public.badges (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  description   text,
  icon          text,
  requirement   text
);

insert into public.badges (name, description, requirement) values
  ('Never Cancels',   'Zero cancellations on record',      'jobs_cancelled = 0 AND jobs_completed >= 10'),
  ('Top Pro',         'Consistently top-rated worker',     'rating_avg >= 4.8 AND jobs_completed >= 50'),
  ('Verified',        'Identity verified',                 'is_verified = true'),
  ('Insured',         'Carries XProHub protection',        'insurance_tier IN (''standard'',''premium'')'),
  ('Top 5%',          'Top 5% of earners in category',    'computed weekly'),
  ('Fast Replies',    'Responds within 5 minutes',         'avg_response_time <= 5'),
  ('Rising Star',     'New worker with exceptional start', 'jobs_completed BETWEEN 1 AND 10 AND rating_avg >= 4.9'),
  ('Money Maker',     'Earned $10k+ on platform',         'total_earned >= 10000'),
  ('Squad Leader',    'Leads a squad of workers',          'belt_level IN (''brown'',''black'')');


-- ============================================================
-- 12. USER BADGES (junction)
-- ============================================================
create table public.user_badges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  badge_id    uuid references public.badges(id),
  earned_at   timestamptz default now(),
  unique(user_id, badge_id)
);


-- ============================================================
-- 13. NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  type        text check (type in (
    'new_bid','bid_accepted','bid_declined',
    'job_matched','job_started','job_completed',
    'payment_received','payment_released',
    'new_message','xp_earned','badge_earned',
    'belt_promoted','worker_nearby','level_up'
  )),
  title       text,
  body        text,
  data        jsonb,
  is_read     boolean default false,
  created_at  timestamptz default now()
);

alter publication supabase_realtime add table public.notifications;


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.user_skills     enable row level security;
alter table public.jobs            enable row level security;
alter table public.bids            enable row level security;
alter table public.chats           enable row level security;
alter table public.messages        enable row level security;
alter table public.payments        enable row level security;
alter table public.reviews         enable row level security;
alter table public.xp_transactions enable row level security;
alter table public.user_badges     enable row level security;
alter table public.notifications   enable row level security;

create policy "Profiles are public" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Open jobs are public" on public.jobs for select
  using (status = 'open' or customer_id = auth.uid() or worker_id = auth.uid());
create policy "Customers create jobs" on public.jobs for insert
  with check (auth.uid() = customer_id);
create policy "Customers update own jobs" on public.jobs for update
  using (auth.uid() = customer_id);

create policy "Bids visible to parties" on public.bids for select
  using (auth.uid() = worker_id or auth.uid() in (
    select customer_id from public.jobs where id = job_id
  ));
create policy "Workers submit bids" on public.bids for insert
  with check (auth.uid() = worker_id);

create policy "Chat parties read" on public.chats for select
  using (auth.uid() = customer_id or auth.uid() = worker_id);

create policy "Messages visible to participants" on public.messages for select
  using (auth.uid() in (
    select customer_id from public.chats where id = chat_id
    union
    select worker_id from public.chats where id = chat_id
  ));
create policy "Participants send messages" on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Payment parties view" on public.payments for select
  using (auth.uid() = customer_id or auth.uid() = worker_id);

create policy "Reviews are public" on public.reviews for select using (true);
create policy "Users write reviews" on public.reviews for insert
  with check (auth.uid() = reviewer_id);

create policy "XP is public" on public.xp_transactions for select using (true);
create policy "Badges are public" on public.user_badges for select using (true);

create policy "Own notifications" on public.notifications for select
  using (auth.uid() = user_id);
create policy "Update own notifications" on public.notifications for update
  using (auth.uid() = user_id);


-- ============================================================
-- INDEXES
-- ============================================================
create index on public.jobs (status, created_at desc);
create index on public.jobs (customer_id);
create index on public.jobs (worker_id);
create index on public.jobs (skill_id);
create index on public.bids (job_id);
create index on public.bids (worker_id);
create index on public.messages (chat_id, created_at desc);
create index on public.notifications (user_id, is_read, created_at desc);
create index on public.xp_transactions (user_id, created_at desc);
create index on public.user_skills (user_id);

-- Geo index for location-based matching
create extension if not exists postgis;
create index on public.jobs using gist (st_makepoint(location_lng, location_lat));
create index on public.profiles using gist (st_makepoint(location_lng, location_lat));


-- ============================================================
-- STORAGE BUCKETS (create in Supabase Dashboard > Storage)
-- avatars      (public)  - profile photos
-- job-photos   (public)  - job listing photos
-- portfolio    (public)  - worker portfolio images
-- id-documents (private) - background check documents
-- ============================================================