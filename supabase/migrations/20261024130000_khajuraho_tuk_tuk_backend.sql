-- Indo Tuk Tuk (Khajuraho) backend.
--
-- One vehicle type (auto rickshaw / tuk tuk), one town (Khajuraho).
--   places             pickup and drop-off points with map coordinates (public read)
--   trips              what can be booked: a metered city ride plus flat-price tours (public read)
--   bookings           ride requests from the website (private)
--   partner_enquiries  drivers and hotels who want to work with us (private)
--
-- The website reads places and trips directly and writes only through the
-- three RPC functions at the bottom. Fares are always worked out here, never
-- taken from the browser. Owners manage bookings in the Supabase dashboard.

-- Places ---------------------------------------------------------------------

create table public.places (
  id         smallint generated always as identity primary key,
  slug       text not null unique,
  name       text not null unique,
  kind       text not null check (kind in ('area', 'temple', 'attraction', 'transport')),
  lat        double precision not null check (lat between -90 and 90),
  lng        double precision not null check (lng between -180 and 180),
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.places enable row level security;

create policy "Anyone can view active places"
  on public.places for select
  to anon, authenticated
  using (is_active);

-- Coordinates are approximate; adjust them in the dashboard if a fare looks off.
insert into public.places (slug, name, kind, lat, lng, sort_order) values
  ('khajuraho-town',        'Khajuraho town (hotel / homestay)',  'area',       24.8530, 79.9290,  10),
  ('western-temples',       'Western Group of Temples',           'temple',     24.8520, 79.9218,  20),
  ('matangeshwar-temple',   'Matangeshwar Temple',                'temple',     24.8510, 79.9213,  30),
  ('archaeological-museum', 'Archaeological Museum',              'attraction', 24.8525, 79.9230,  40),
  ('shiv-sagar-lake',       'Shiv Sagar Lake',                    'attraction', 24.8505, 79.9240,  50),
  ('eastern-temples',       'Eastern Group (Jain Temples)',       'temple',     24.8448, 79.9358,  60),
  ('duladeo-temple',        'Duladeo Temple (Southern Group)',    'temple',     24.8335, 79.9305,  70),
  ('chaturbhuj-temple',     'Chaturbhuj Temple (Southern Group)', 'temple',     24.8238, 79.9255,  80),
  ('shilpgram',             'Shilpgram',                          'attraction', 24.8475, 79.9318,  90),
  ('bus-stand',             'Khajuraho Bus Stand',                'transport',  24.8500, 79.9290, 100),
  ('airport',               'Khajuraho Airport (HJR)',            'transport',  24.8172, 79.9186, 110),
  ('railway-station',       'Khajuraho Railway Station',          'transport',  24.9150, 79.9320, 120),
  ('beni-sagar-dam',        'Beni Sagar Dam',                     'attraction', 24.8305, 79.9045, 130),
  ('rajnagar',              'Rajnagar',                           'area',       24.8960, 79.9080, 140);

-- Trips ----------------------------------------------------------------------

create table public.trips (
  id            smallint generated always as identity primary key,
  slug          text not null unique,
  name          text not null unique,
  category      text not null check (category in ('ride', 'tour', 'day_trip')),
  pricing_model text not null check (pricing_model in ('metered', 'flat')),
  base_fare     integer not null check (base_fare >= 0),   -- rupees; the whole price for flat trips
  per_km        integer not null default 0 check (per_km >= 0),
  min_fare      integer not null default 0 check (min_fare >= 0),
  price_unit    text not null,                             -- label shown next to the price
  duration      text,                                      -- e.g. '4–5 hours'
  description   text not null,
  needs_dropoff boolean not null,                          -- false = round trip back to pickup
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "Anyone can view active trips"
  on public.trips for select
  to anon, authenticated
  using (is_active);

insert into public.trips
  (slug, name, category, pricing_model, base_fare, per_km, min_fare, price_unit, duration, description, needs_dropoff, sort_order)
values
  ('city-ride', 'City ride', 'ride', 'metered', 40, 15, 60, 'per ride', null,
   'Point to point anywhere in Khajuraho: hotel, temples, market, bus stand, airport or railway station.', true, 10),
  ('western-temples-visit', 'Western Temples visit', 'tour', 'flat', 399, 0, 0, 'return trip', '3 hours',
   'Drop at the Western Group, driver waits while you explore, then back to your hotel.', false, 20),
  ('temple-circuit', 'Full temple circuit', 'tour', 'flat', 799, 0, 0, 'per auto', '4–5 hours',
   'Western, Eastern and Southern groups in one go, with waiting time at each stop.', false, 30),
  ('light-and-sound-show', 'Light & Sound Show evening', 'tour', 'flat', 349, 0, 0, 'return trip', '2 hours',
   'Evening drop for the show at the Western Group and a ride back after it ends.', false, 40),
  ('raneh-falls', 'Raneh Falls & Ken Gharial', 'day_trip', 'flat', 1199, 0, 0, 'per auto', '5 hours',
   'Canyon views at Raneh Falls and the Ken Gharial Sanctuary, about 20 km away.', false, 50),
  ('panna-national-park', 'Panna National Park gate', 'day_trip', 'flat', 1099, 0, 0, 'per auto', 'Half day',
   'Ride to the Madla gate for your safari and back. Safari tickets are separate.', false, 60),
  ('pandav-falls', 'Pandav Falls', 'day_trip', 'flat', 1499, 0, 0, 'per auto', '6 hours',
   'Waterfall and caves on the Panna road, with a stop on the way back.', false, 70);

-- Bookings -------------------------------------------------------------------

create table public.bookings (
  id             uuid primary key default gen_random_uuid(),
  booking_code   text not null unique,
  trip_id        smallint not null references public.trips (id),
  pickup_id      smallint not null references public.places (id),
  dropoff_id     smallint references public.places (id),
  pickup_note    text check (pickup_note is null or char_length(pickup_note) <= 200),
  scheduled_at   timestamptz,                               -- null = as soon as possible
  passengers     smallint not null default 1 check (passengers between 1 and 4),
  rider_name     text not null check (char_length(rider_name) between 2 and 80),
  rider_phone    text not null check (rider_phone ~ '^\+?[0-9]{8,15}$'),
  distance_km    numeric(5, 1),
  fare           integer not null check (fare >= 0),
  status         text not null default 'new'
                 check (status in ('new', 'confirmed', 'driver_assigned', 'completed', 'cancelled')),
  driver_name    text,                                      -- filled in by the team
  vehicle_number text,
  admin_notes    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index bookings_trip_id_idx on public.bookings (trip_id);
create index bookings_pickup_id_idx on public.bookings (pickup_id);
create index bookings_dropoff_id_idx on public.bookings (dropoff_id);
create index bookings_status_created_idx on public.bookings (status, created_at desc);
create index bookings_rider_phone_created_idx on public.bookings (rider_phone, created_at desc);

-- No policies: visitors cannot read or change bookings; only create_booking() inserts.
alter table public.bookings enable row level security;

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger bookings_touch_updated_at
  before update on public.bookings
  for each row execute function public.touch_updated_at();

-- Partner enquiries ----------------------------------------------------------

create table public.partner_enquiries (
  id         uuid primary key default gen_random_uuid(),
  role       text not null check (role in ('driver', 'hotel')),
  name       text not null check (char_length(name) between 2 and 80),
  phone      text not null check (phone ~ '^\+?[0-9]{8,15}$'),
  message    text check (message is null or char_length(message) <= 500),
  status     text not null default 'new' check (status in ('new', 'contacted', 'onboarded', 'declined')),
  created_at timestamptz not null default now()
);

create index partner_enquiries_phone_created_idx on public.partner_enquiries (phone, created_at desc);

-- No policies: only submit_partner_enquiry() inserts.
alter table public.partner_enquiries enable row level security;

-- Helpers (not callable from the website) ------------------------------------

-- Phone numbers: keep digits and a leading +; Indian 10-digit numbers get +91.
create function public.normalize_phone(p_phone text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when v ~ '^[6-9][0-9]{9}$' then '+91' || v
    when v ~ '^0[6-9][0-9]{9}$' then '+91' || substr(v, 2)
    when v ~ '^91[6-9][0-9]{9}$' then '+' || v
    when v <> '' and left(trim(p_phone), 1) = '+' then '+' || v
    else v
  end
  from (select regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g') as v) s;
$$;

-- Road distance estimate: straight-line distance x 1.3.
create function public.road_distance_km(p_from public.places, p_to public.places)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select round((1.3 * 2 * 6371 * asin(sqrt(
    power(sin(radians(p_to.lat - p_from.lat) / 2), 2)
    + cos(radians(p_from.lat)) * cos(radians(p_to.lat)) * power(sin(radians(p_to.lng - p_from.lng) / 2), 2)
  )))::numeric, 1);
$$;

create function public.trip_fare(p_trip public.trips, p_distance_km numeric)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_trip.pricing_model
    when 'flat' then p_trip.base_fare
    else greatest(p_trip.min_fare,
                  (round((p_trip.base_fare + p_trip.per_km * coalesce(p_distance_km, 0)) / 5.0) * 5)::integer)
  end;
$$;

-- Shared by get_quote and create_booking so both always agree.
create function public.price_trip(p_trip_slug text, p_pickup_slug text, p_dropoff_slug text)
returns table (trip_id smallint, trip_name text, pickup_id smallint, dropoff_id smallint,
               distance_km numeric, fare integer, price_unit text)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_trip    public.trips;
  v_pickup  public.places;
  v_dropoff public.places;
  v_km      numeric;
begin
  select * into v_trip from public.trips t where t.slug = p_trip_slug and t.is_active;
  if not found then
    raise exception 'That trip is not available right now' using errcode = '22023';
  end if;

  select * into v_pickup from public.places p where p.slug = p_pickup_slug and p.is_active;
  if not found then
    raise exception 'Choose a pickup point' using errcode = '22023';
  end if;

  if v_trip.needs_dropoff then
    select * into v_dropoff from public.places p where p.slug = p_dropoff_slug and p.is_active;
    if not found then
      raise exception 'Choose a drop-off point' using errcode = '22023';
    end if;
    if v_dropoff.id = v_pickup.id then
      raise exception 'Pickup and drop-off are the same place' using errcode = '22023';
    end if;
    v_km := public.road_distance_km(v_pickup, v_dropoff);
  end if;

  return query select v_trip.id, v_trip.name, v_pickup.id, v_dropoff.id,
                      v_km, public.trip_fare(v_trip, v_km), v_trip.price_unit;
end;
$$;

-- Website RPCs ---------------------------------------------------------------

-- "See fare": returns the price, stores nothing.
create function public.get_quote(p_trip text, p_pickup text, p_dropoff text default null)
returns table (trip_name text, distance_km numeric, fare integer, price_unit text)
language sql
stable
security definer
set search_path = ''
as $$
  select q.trip_name, q.distance_km, q.fare, q.price_unit
  from public.price_trip(p_trip, p_pickup, p_dropoff) q;
$$;

-- "Confirm booking": saves the request; the team then calls the rider to confirm.
create function public.create_booking(
  p_trip         text,
  p_pickup       text,
  p_dropoff      text,
  p_rider_name   text,
  p_rider_phone  text,
  p_passengers   integer default 1,
  p_scheduled_at timestamptz default null,
  p_pickup_note  text default null
)
returns table (booking_code text, trip_name text, fare integer, scheduled_at timestamptz, rider_phone text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_quote record;
  v_name  text := nullif(trim(p_rider_name), '');
  v_phone text := public.normalize_phone(p_rider_phone);
  v_note  text := nullif(trim(p_pickup_note), '');
  v_code  text;
begin
  select * into v_quote from public.price_trip(p_trip, p_pickup, p_dropoff);

  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'Add your name' using errcode = '22023';
  end if;
  if v_phone !~ '^\+?[0-9]{8,15}$' then
    raise exception 'Add a phone number we can call or WhatsApp' using errcode = '22023';
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

  -- Light spam guard: at most 5 open bookings per phone number per hour.
  if (select count(*) from public.bookings b
      where b.rider_phone = v_phone and b.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many bookings from this number. Please wait a little or call us.' using errcode = '22023';
  end if;

  loop
    v_code := 'KJ-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from public.bookings b where b.booking_code = v_code);
  end loop;

  insert into public.bookings (booking_code, trip_id, pickup_id, dropoff_id, pickup_note, scheduled_at,
                               passengers, rider_name, rider_phone, distance_km, fare)
  values (v_code, v_quote.trip_id, v_quote.pickup_id, v_quote.dropoff_id, v_note, p_scheduled_at,
          p_passengers, v_name, v_phone, v_quote.distance_km, v_quote.fare);

  return query select v_code, v_quote.trip_name, v_quote.fare, p_scheduled_at, v_phone;
end;
$$;

-- "Drive with us" / "Hotels & homestays" form.
create function public.submit_partner_enquiry(p_role text, p_name text, p_phone text, p_message text default null)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_name    text := nullif(trim(p_name), '');
  v_phone   text := public.normalize_phone(p_phone);
  v_message text := nullif(trim(p_message), '');
begin
  if p_role not in ('driver', 'hotel') then
    raise exception 'Choose driver or hotel' using errcode = '22023';
  end if;
  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'Add your name' using errcode = '22023';
  end if;
  if v_phone !~ '^\+?[0-9]{8,15}$' then
    raise exception 'Add a phone number we can call' using errcode = '22023';
  end if;
  if v_message is not null and char_length(v_message) > 500 then
    raise exception 'Keep the message under 500 characters' using errcode = '22023';
  end if;

  if (select count(*) from public.partner_enquiries e
      where e.phone = v_phone and e.created_at > now() - interval '1 day') >= 3 then
    return true;  -- already heard from this number today
  end if;

  insert into public.partner_enquiries (role, name, phone, message)
  values (p_role, v_name, v_phone, v_message);
  return true;
end;
$$;

-- Permissions: the website can call only the three RPCs above.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.get_quote(text, text, text) to anon, authenticated;
grant execute on function public.create_booking(text, text, text, text, text, integer, timestamptz, text) to anon, authenticated;
grant execute on function public.submit_partner_enquiry(text, text, text, text) to anon, authenticated;
