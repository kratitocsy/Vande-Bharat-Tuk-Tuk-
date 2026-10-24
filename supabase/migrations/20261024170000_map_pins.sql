-- Map pins: customers can drop a pin for pickup and/or drop-off instead of choosing a listed place.
-- New functions (request_ride_v2, rider_requests_v2) are added next to the old ones so the live
-- website keeps working until the new version is deployed. Nothing is dropped.

alter table public.bookings
  add column pickup_lat  double precision,
  add column pickup_lng  double precision,
  add column dropoff_lat double precision,
  add column dropoff_lng double precision;

-- Stand-in place used when the customer drops a pin; the real position is in the *_lat / *_lng columns.
insert into public.places (slug, name, kind, lat, lng, sort_order)
values ('pinned-location', 'Pinned on map', 'area', 24.8530, 79.9290, 5)
on conflict (slug) do nothing;

-- Pins must be in the Khajuraho region (about 55 km each way from the town).
create function public.valid_pin(p_lat double precision, p_lng double precision)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_lat is not null and p_lng is not null
     and p_lat between 24.35 and 25.35
     and p_lng between 79.40 and 80.40;
$$;

create function public.request_ride_v2(
  p_trip         text,
  p_pickup       text,
  p_dropoff      text,
  p_rider_name   text,
  p_rider_phone  text,
  p_passengers   integer default 1,
  p_scheduled_at timestamptz default null,
  p_pickup_note  text default null,
  p_budget       integer default null,
  p_pickup_lat   double precision default null,
  p_pickup_lng   double precision default null,
  p_dropoff_lat  double precision default null,
  p_dropoff_lng  double precision default null
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
  v_plat    double precision;
  v_plng    double precision;
  v_dlat    double precision;
  v_dlng    double precision;
  v_pin_p   boolean := false;
  v_pin_d   boolean := false;
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
  if v_pickup.slug = 'pinned-location' then
    if not public.valid_pin(p_pickup_lat, p_pickup_lng) then
      raise exception 'Drop the pickup pin inside the Khajuraho area' using errcode = '22023';
    end if;
    v_pin_p := true;
    v_plat := p_pickup_lat;
    v_plng := p_pickup_lng;
  else
    v_plat := v_pickup.lat;
    v_plng := v_pickup.lng;
  end if;

  if v_trip.needs_dropoff then
    select * into v_dropoff from public.places p where p.slug = p_dropoff and p.is_active;
    if not found then
      raise exception 'Choose a drop-off point' using errcode = '22023';
    end if;
    if v_dropoff.slug = 'pinned-location' then
      if not public.valid_pin(p_dropoff_lat, p_dropoff_lng) then
        raise exception 'Drop the drop-off pin inside the Khajuraho area' using errcode = '22023';
      end if;
      v_pin_d := true;
      v_dlat := p_dropoff_lat;
      v_dlng := p_dropoff_lng;
    else
      if v_dropoff.id = v_pickup.id then
        raise exception 'Pickup and drop-off are the same place' using errcode = '22023';
      end if;
      v_dlat := v_dropoff.lat;
      v_dlng := v_dropoff.lng;
    end if;

    -- straight-line distance x 1.3 as a rough road estimate
    v_km := round((1.3 * 2 * 6371 * asin(sqrt(
              power(sin(radians(v_dlat - v_plat) / 2), 2)
              + cos(radians(v_plat)) * cos(radians(v_dlat)) * power(sin(radians(v_dlng - v_plng) / 2), 2)
            )))::numeric, 1);
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
                               passengers, rider_name, rider_phone, distance_km, budget,
                               pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)
  values (v_code, v_trip.id, v_pickup.id, v_dropoff.id, v_note, p_scheduled_at,
          p_passengers, v_name, v_phone, v_km, p_budget,
          case when v_pin_p then v_plat end, case when v_pin_p then v_plng end,
          case when v_pin_d then v_dlat end, case when v_pin_d then v_dlng end);

  return query select v_code, v_trip.name, p_scheduled_at, v_phone;
end;
$$;

-- Rider view with map coordinates (pin position, or the listed place's position).
create function public.rider_requests_v2()
returns table (
  id             uuid,
  booking_code   text,
  status         text,
  trip_name      text,
  pickup_name    text,
  dropoff_name   text,
  pickup_lat     double precision,
  pickup_lng     double precision,
  dropoff_lat    double precision,
  dropoff_lng    double precision,
  scheduled_at   timestamptz,
  passengers     smallint,
  customer_name  text,
  customer_phone text,
  pickup_note    text,
  budget         integer,
  agreed_fare    integer,
  created_at     timestamptz,
  mine           boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_driver uuid := public.current_driver_id();
begin
  if v_driver is null then
    raise exception 'Your rider account is not approved yet' using errcode = '42501';
  end if;

  return query
    select b.id, b.booking_code, b.status, t.name, p.name, dp.name,
           coalesce(b.pickup_lat, p.lat), coalesce(b.pickup_lng, p.lng),
           coalesce(b.dropoff_lat, dp.lat), coalesce(b.dropoff_lng, dp.lng),
           b.scheduled_at, b.passengers, b.rider_name, b.rider_phone, b.pickup_note, b.budget, b.fare,
           b.created_at, (b.driver_id = v_driver)
    from public.bookings b
    join public.trips  t on t.id = b.trip_id
    join public.places p on p.id = b.pickup_id
    left join public.places dp on dp.id = b.dropoff_id
    where (b.status = 'new' and b.driver_id is null and b.created_at > now() - interval '2 days')
       or (b.driver_id = v_driver and (b.status = 'driver_assigned' or b.updated_at > now() - interval '2 days'))
    order by b.created_at desc
    limit 100;
end;
$$;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.get_available_riders() to anon, authenticated;
grant execute on function public.request_ride(text, text, text, text, text, integer, timestamptz, text, integer) to anon, authenticated;
grant execute on function public.request_ride_v2(text, text, text, text, text, integer, timestamptz, text, integer, double precision, double precision, double precision, double precision) to anon, authenticated;
grant execute on function public.submit_partner_enquiry(text, text, text, text) to anon, authenticated;
grant execute on function public.rider_me() to authenticated;
grant execute on function public.rider_requests() to authenticated;
grant execute on function public.rider_requests_v2() to authenticated;
grant execute on function public.rider_accept(uuid) to authenticated;
grant execute on function public.rider_release(uuid) to authenticated;
grant execute on function public.rider_complete(uuid, integer) to authenticated;
grant execute on function public.rider_cancel(uuid) to authenticated;
grant execute on function public.rider_set_available(boolean) to authenticated;
