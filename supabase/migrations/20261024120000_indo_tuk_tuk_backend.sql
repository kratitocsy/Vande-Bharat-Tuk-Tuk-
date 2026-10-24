-- Indo Tuk Tuk backend: ride catalog, fare quotes, ride bookings, app-link signups.
-- The website talks to the database only through the RPC functions below.
-- Tables have RLS on; visitors can read the active ride catalog and nothing else directly.

-- Ride catalog ---------------------------------------------------------------

create table public.ride_types (
  id            smallint generated always as identity primary key,
  slug          text not null unique,
  name          text not null unique,
  category      text not null check (category in ('city', 'outstation', 'rentals')),
  pricing_model text not null check (pricing_model in ('metered', 'flat')),
  base_fare     integer not null check (base_fare >= 0),      -- rupees
  per_km        integer not null default 0 check (per_km >= 0),
  min_fare      integer not null default 0 check (min_fare >= 0),
  price_unit    text not null,                                -- label, e.g. 'base fare', 'per day'
  seats         text not null,
  eta_minutes   integer,                                      -- typical pickup time for on-demand rides
  needs_dropoff boolean not null default true,
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table public.ride_types enable row level security;

create policy "Anyone can view active ride types"
  on public.ride_types for select
  to anon, authenticated
  using (is_active);

insert into public.ride_types
  (slug, name, category, pricing_model, base_fare, per_km, min_fare, price_unit, seats, eta_minutes, needs_dropoff, sort_order)
values
  ('indo-tuk-tuk',        'Indo Tuk Tuk',        'city',       'metered',   49, 12,    0, 'base fare',        '1–3 seats',     3, true,  10),
  ('tuk-tuk-xl',          'Tuk Tuk XL',          'city',       'metered',   79, 16,    0, 'base fare',        '1–5 seats',     5, true,  20),
  ('indo-bike',           'Indo Bike',           'city',       'metered',   29,  8,    0, 'base fare',        '1 rider',       2, true,  30),
  ('indo-cab',            'Indo Cab',            'city',       'metered',  129, 20,    0, 'base fare',        '1–4 seats',     6, true,  40),
  ('indo-outstation',     'Indo Outstation',     'outstation', 'metered',    0, 14,  999, 'per km',           '1–4 seats',  null, true,  50),
  ('weekend-escape',      'Weekend Escape',      'outstation', 'flat',    3499,  0,    0, 'per day',          'Up to 6 seats', null, true,  60),
  ('airport-transfer',    'Airport Transfer',    'outstation', 'flat',     749,  0,    0, 'flat fare',        '1–4 seats',  null, true,  70),
  ('group-van',           'Group Van',           'outstation', 'flat',    4299,  0,    0, 'per day',          'Up to 9 seats', null, true,  80),
  ('tuk-tuk-by-the-hour', 'Tuk Tuk by the Hour', 'rentals',    'flat',     249,  0,    0, 'per hour',         '1–3 seats',  null, false, 90),
  ('city-in-a-day',       'City in a Day',       'rentals',    'flat',     899,  0,    0, 'per booking',      '4 hours',    null, false, 100),
  ('indo-self-drive',     'Indo Self Drive',     'rentals',    'flat',    1299,  0,    0, 'per day',          '1–5 seats',  null, false, 110),
  ('monthly-commute',     'Monthly Commute',     'rentals',    'flat',    5999,  0,    0, 'per month',        'Weekdays',   null, true,  120);

-- Ride bookings --------------------------------------------------------------

create table public.ride_requests (
  id            uuid primary key default gen_random_uuid(),
  booking_code  text not null unique,
  ride_type_id  smallint not null references public.ride_types (id),
  pickup        text not null check (char_length(pickup) between 2 and 200),
  dropoff       text check (dropoff is null or char_length(dropoff) between 2 and 200),
  scheduled_at  timestamptz,                                  -- null = ride now
  distance_km   numeric(6, 1),
  fare          integer not null check (fare >= 0),
  status        text not null default 'requested'
                check (status in ('requested', 'driver_assigned', 'in_progress', 'completed', 'cancelled')),
  created_at    timestamptz not null default now()
);

create index ride_requests_ride_type_id_idx on public.ride_requests (ride_type_id);
create index ride_requests_created_at_idx on public.ride_requests (created_at desc);

-- No policies: visitors cannot read or write this table directly; only book_ride() inserts.
alter table public.ride_requests enable row level security;

-- App-link signups -----------------------------------------------------------

create table public.app_link_signups (
  id         uuid primary key default gen_random_uuid(),
  email      text not null check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' and char_length(email) <= 254),
  created_at timestamptz not null default now()
);

create unique index app_link_signups_email_key on public.app_link_signups (lower(email));

-- No policies: only request_app_link() inserts.
alter table public.app_link_signups enable row level security;

-- Fare logic -----------------------------------------------------------------

-- Placeholder distance until a maps API is connected. Deterministic so a quote
-- and the booking that follows it always agree. Same formula the site used before.
create function public.estimate_distance_km(p_pickup text, p_dropoff text)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select round(2 + ((char_length(coalesce(p_pickup, '')) * 7
                   + char_length(coalesce(p_dropoff, '')) * 13) % 170) / 10.0, 1);
$$;

create function public.calculate_fare(p_ride public.ride_types, p_distance_km numeric)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_ride.pricing_model
    when 'flat' then p_ride.base_fare
    else greatest(
      p_ride.min_fare,
      (round((p_ride.base_fare + p_ride.per_km * coalesce(p_distance_km, 0)) / 5.0) * 5)::integer
    )
  end;
$$;

-- Public RPCs ----------------------------------------------------------------

-- "See prices": fares for every active ride type for this trip. Stores nothing.
create function public.get_fare_quotes(p_pickup text, p_dropoff text)
returns table (
  slug         text,
  name         text,
  category     text,
  fare         integer,
  price_unit   text,
  eta_minutes  integer,
  distance_km  numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select r.slug,
         r.name,
         r.category,
         public.calculate_fare(r, public.estimate_distance_km(trim(p_pickup), trim(p_dropoff))),
         r.price_unit,
         r.eta_minutes,
         public.estimate_distance_km(trim(p_pickup), trim(p_dropoff))
  from public.ride_types r
  where r.is_active
  order by r.sort_order;
$$;

-- "Choose": books a ride. Fare is always computed here, never taken from the browser.
create function public.book_ride(
  p_ride_slug    text,
  p_pickup       text,
  p_dropoff      text default null,
  p_scheduled_at timestamptz default null
)
returns table (
  booking_code text,
  ride_name    text,
  fare         integer,
  eta_minutes  integer,
  scheduled_at timestamptz,
  status       text
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ride     public.ride_types;
  v_pickup   text := nullif(trim(p_pickup), '');
  v_dropoff  text := nullif(trim(p_dropoff), '');
  v_distance numeric;
  v_code     text;
begin
  select * into v_ride from public.ride_types r where r.slug = p_ride_slug and r.is_active;
  if not found then
    raise exception 'Unknown ride type' using errcode = '22023';
  end if;

  if v_pickup is null then
    raise exception 'Add a pickup location' using errcode = '22023';
  end if;
  if v_ride.needs_dropoff and v_dropoff is null then
    raise exception 'Add a drop-off location' using errcode = '22023';
  end if;
  if p_scheduled_at is not null
     and (p_scheduled_at < now() - interval '5 minutes' or p_scheduled_at > now() + interval '90 days') then
    raise exception 'Pick a time within the next 90 days' using errcode = '22023';
  end if;

  v_distance := case when v_dropoff is null then null
                     else public.estimate_distance_km(v_pickup, v_dropoff) end;

  loop
    v_code := 'IND-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from public.ride_requests q where q.booking_code = v_code);
  end loop;

  insert into public.ride_requests (booking_code, ride_type_id, pickup, dropoff, scheduled_at, distance_km, fare)
  values (v_code, v_ride.id, v_pickup, v_dropoff, p_scheduled_at, v_distance,
          public.calculate_fare(v_ride, v_distance));

  return query
    select q.booking_code, v_ride.name, q.fare, v_ride.eta_minutes, q.scheduled_at, q.status
    from public.ride_requests q
    where q.booking_code = v_code;
end;
$$;

-- "Get the app": saves the email once; repeat signups are ignored quietly.
create function public.request_app_link(p_email text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if v_email is null or v_email !~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' or char_length(v_email) > 254 then
    raise exception 'Enter a valid email address' using errcode = '22023';
  end if;

  insert into public.app_link_signups (email)
  values (v_email)
  on conflict ((lower(email))) do nothing;

  return true;
end;
$$;

-- Only the three public RPCs are callable from the website.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.get_fare_quotes(text, text) to anon, authenticated;
grant execute on function public.book_ride(text, text, text, timestamptz) to anon, authenticated;
grant execute on function public.request_app_link(text) to anon, authenticated;
-- get_fare_quotes runs as the caller, so the caller needs the helpers too.
grant execute on function public.estimate_distance_km(text, text) to anon, authenticated;
grant execute on function public.calculate_fare(public.ride_types, numeric) to anon, authenticated;
