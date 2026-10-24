-- Live rider tracking: an accepted rider can share their position; the customer who made
-- the request can follow it using their request code plus the phone number they gave.

create table public.rider_locations (
  driver_id  uuid primary key references public.drivers (id) on delete cascade,
  lat        double precision not null,
  lng        double precision not null,
  accuracy_m real,
  updated_at timestamptz not null default now()
);

-- No policies: positions are only written by rider_update_location() and read by track_ride().
alter table public.rider_locations enable row level security;

create function public.rider_update_location(p_lat double precision, p_lng double precision, p_accuracy real default null)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_driver uuid := public.current_driver_id();
begin
  if v_driver is null then
    raise exception 'Your rider account is not approved yet' using errcode = '42501';
  end if;
  if not public.valid_pin(p_lat, p_lng) then
    raise exception 'Location is outside the Khajuraho area' using errcode = '22023';
  end if;

  insert into public.rider_locations as l (driver_id, lat, lng, accuracy_m, updated_at)
  values (v_driver, p_lat, p_lng, p_accuracy, now())
  on conflict (driver_id) do update
    set lat = excluded.lat, lng = excluded.lng, accuracy_m = excluded.accuracy_m, updated_at = now();
  return true;
end;
$$;

create function public.rider_stop_sharing()
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_driver uuid := public.current_driver_id();
begin
  if v_driver is null then
    raise exception 'Your rider account is not approved yet' using errcode = '42501';
  end if;
  -- Expire the saved position instead of deleting it; track_ride() only shows positions from the last 30 minutes.
  update public.rider_locations l set updated_at = 'epoch' where l.driver_id = v_driver;
  return true;
end;
$$;

-- For the customer: where is my rider? Needs the request code AND the customer's phone number.
create function public.track_ride(p_code text, p_phone text)
returns table (
  status        text,
  rider_name    text,
  rider_phone   text,
  lat           double precision,
  lng           double precision,
  updated_at    timestamptz,
  pickup_lat    double precision,
  pickup_lng    double precision,
  dropoff_lat   double precision,
  dropoff_lng   double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.status, d.name, d.phone, l.lat, l.lng, l.updated_at,
         coalesce(b.pickup_lat, p.lat), coalesce(b.pickup_lng, p.lng),
         coalesce(b.dropoff_lat, dp.lat), coalesce(b.dropoff_lng, dp.lng)
  from public.bookings b
  join public.places p on p.id = b.pickup_id
  left join public.places dp on dp.id = b.dropoff_id
  left join public.drivers d on d.id = b.driver_id
  left join public.rider_locations l on l.driver_id = b.driver_id and l.updated_at > now() - interval '30 minutes'
  where b.booking_code = upper(trim(p_code))
    and b.rider_phone = public.normalize_phone(p_phone)
  limit 1;
$$;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.get_available_riders() to anon, authenticated;
grant execute on function public.request_ride(text, text, text, text, text, integer, timestamptz, text, integer) to anon, authenticated;
grant execute on function public.request_ride_v2(text, text, text, text, text, integer, timestamptz, text, integer, double precision, double precision, double precision, double precision) to anon, authenticated;
grant execute on function public.submit_partner_enquiry(text, text, text, text) to anon, authenticated;
grant execute on function public.track_ride(text, text) to anon, authenticated;
grant execute on function public.rider_me() to authenticated;
grant execute on function public.rider_requests() to authenticated;
grant execute on function public.rider_requests_v2() to authenticated;
grant execute on function public.rider_accept(uuid) to authenticated;
grant execute on function public.rider_release(uuid) to authenticated;
grant execute on function public.rider_complete(uuid, integer) to authenticated;
grant execute on function public.rider_cancel(uuid) to authenticated;
grant execute on function public.rider_set_available(boolean) to authenticated;
grant execute on function public.rider_update_location(double precision, double precision, real) to authenticated;
grant execute on function public.rider_stop_sharing() to authenticated;
