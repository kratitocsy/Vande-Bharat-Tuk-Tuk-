-- Ride requests without fixed fares: riders are shown to the customer, call them,
-- and agree the price by phone. The customer's budget is optional.
--
-- Non-destructive: nothing is dropped. The old fare functions are simply no longer
-- callable from the website, and trips' old price columns are left unused.

-- bookings.fare now means the price agreed after the call (filled in by the team).
alter table public.bookings alter column fare drop not null;
alter table public.bookings
  add column budget integer check (budget is null or budget between 10 and 20000);

-- Riders who can take bookings -------------------------------------------------

create table public.drivers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 2 and 80),
  phone          text not null unique check (phone ~ '^\+?[0-9]{8,15}$'),
  vehicle_number text,
  is_available   boolean not null default true,
  created_at     timestamptz not null default now()
);

-- No policies: the public sees riders only through get_available_riders().
alter table public.drivers enable row level security;

insert into public.drivers (name, phone)
values ('Indo Tuk Tuk rider', '+919893413847');

-- Public functions ---------------------------------------------------------------

create function public.get_available_riders()
returns table (name text, phone text, vehicle_number text)
language sql
stable
security definer
set search_path = ''
as $$
  select d.name, d.phone, d.vehicle_number
  from public.drivers d
  where d.is_available
  order by d.created_at;
$$;

create function public.request_ride(
  p_trip         text,
  p_pickup       text,
  p_dropoff      text,
  p_rider_name   text,
  p_rider_phone  text,
  p_passengers   integer default 1,
  p_scheduled_at timestamptz default null,
  p_pickup_note  text default null,
  p_budget       integer default null
)
returns table (booking_code text, trip_name text, scheduled_at timestamptz, rider_phone text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_trip    public.trips;
  v_pickup  public.places;
  v_dropoff public.places;
  v_km      numeric;
  v_name    text := nullif(trim(p_rider_name), '');
  v_phone   text := public.normalize_phone(p_rider_phone);
  v_note    text := nullif(trim(p_pickup_note), '');
  v_code    text;
begin
  select * into v_trip from public.trips t where t.slug = p_trip and t.is_active;
  if not found then
    raise exception 'That trip is not available right now' using errcode = '22023';
  end if;

  select * into v_pickup from public.places p where p.slug = p_pickup and p.is_active;
  if not found then
    raise exception 'Choose a pickup point' using errcode = '22023';
  end if;

  if v_trip.needs_dropoff then
    select * into v_dropoff from public.places p where p.slug = p_dropoff and p.is_active;
    if not found then
      raise exception 'Choose a drop-off point' using errcode = '22023';
    end if;
    if v_dropoff.id = v_pickup.id then
      raise exception 'Pickup and drop-off are the same place' using errcode = '22023';
    end if;
    v_km := public.road_distance_km(v_pickup, v_dropoff);
  end if;

  if p_budget is not null and p_budget not between 10 and 20000 then
    raise exception 'Enter a budget between ₹10 and ₹20,000, or leave it empty' using errcode = '22023';
  end if;
  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'Add your name' using errcode = '22023';
  end if;
  if v_phone !~ '^\+?[0-9]{8,15}$' then
    raise exception 'Add a phone number a rider can call or WhatsApp' using errcode = '22023';
  end if;
  if p_passengers is null or p_passengers not between 1 and 3 then
    raise exception 'An auto fits up to 3 passengers' using errcode = '22023';
  end if;
  if v_note is not null and char_length(v_note) > 200 then
    raise exception 'Keep pickup details under 200 characters' using errcode = '22023';
  end if;
  if p_scheduled_at is not null
     and (p_scheduled_at < now() - interval '10 minutes' or p_scheduled_at > now() + interval '60 days') then
    raise exception 'Pick a time within the next 60 days' using errcode = '22023';
  end if;

  if (select count(*) from public.bookings b
      where b.rider_phone = v_phone and b.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many requests from this number. Please wait a little or call a rider.' using errcode = '22023';
  end if;

  loop
    v_code := 'KJ-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from public.bookings b where b.booking_code = v_code);
  end loop;

  insert into public.bookings (booking_code, trip_id, pickup_id, dropoff_id, pickup_note, scheduled_at,
                               passengers, rider_name, rider_phone, distance_km, budget)
  values (v_code, v_trip.id, v_pickup.id, v_dropoff.id, v_note, p_scheduled_at,
          p_passengers, v_name, v_phone, v_km, p_budget);

  return query select v_code, v_trip.name, p_scheduled_at, v_phone;
end;
$$;

-- Permissions: the website can call only these three; the old fare functions are shut off.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.get_available_riders() to anon, authenticated;
grant execute on function public.request_ride(text, text, text, text, text, integer, timestamptz, text, integer) to anon, authenticated;
grant execute on function public.submit_partner_enquiry(text, text, text, text) to anon, authenticated;
