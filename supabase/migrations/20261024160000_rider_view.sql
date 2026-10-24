-- Rider view: approved riders can sign in, see open requests, accept them and mark them done.
-- A rider is approved by adding their email to the drivers table; the first time they sign in
-- with that (confirmed) email, their account is linked automatically.
-- Customers' phone numbers are only returned to approved riders.

alter table public.drivers
  add column email   text,
  add column user_id uuid references auth.users (id) on delete set null;

create unique index drivers_email_key   on public.drivers (lower(email)) where email is not null;
create unique index drivers_user_id_key on public.drivers (user_id)      where user_id is not null;

alter table public.bookings
  add column driver_id uuid references public.drivers (id) on delete set null;

create index bookings_driver_id_idx on public.bookings (driver_id);

-- Internal helper (not callable from the website)
create function public.current_driver_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select d.id from public.drivers d where d.user_id = auth.uid();
$$;

-- Who am I? Also links the account to a rider profile that has the same confirmed email.
create function public.rider_me()
returns table (id uuid, name text, phone text, is_available boolean)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    raise exception 'Please sign in' using errcode = '28000';
  end if;

  select u.email into v_email
  from auth.users u
  where u.id = v_uid and u.email_confirmed_at is not null;

  if v_email is not null then
    update public.drivers d
    set user_id = v_uid
    where d.user_id is null and d.email is not null and lower(d.email) = lower(v_email);
  end if;

  return query
    select d.id, d.name, d.phone, d.is_available
    from public.drivers d
    where d.user_id = v_uid;
end;
$$;

-- Open requests plus this rider's own recent rides.
create function public.rider_requests()
returns table (
  id             uuid,
  booking_code   text,
  status         text,
  trip_name      text,
  pickup_name    text,
  dropoff_name   text,
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
    select b.id, b.booking_code, b.status, t.name, p.name, dp.name, b.scheduled_at, b.passengers,
           b.rider_name, b.rider_phone, b.pickup_note, b.budget, b.fare, b.created_at,
           (b.driver_id = v_driver)
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

-- Take an open request.
create function public.rider_accept(p_booking uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_driver uuid := public.current_driver_id();
  v_code   text;
begin
  if v_driver is null then
    raise exception 'Your rider account is not approved yet' using errcode = '42501';
  end if;

  update public.bookings b
  set driver_id = v_driver, status = 'driver_assigned'
  where b.id = p_booking and b.status = 'new' and b.driver_id is null
  returning b.booking_code into v_code;

  if v_code is null then
    raise exception 'Another rider already took this request' using errcode = '22023';
  end if;
  return v_code;
end;
$$;

-- Give a request back so another rider can take it.
create function public.rider_release(p_booking uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_driver uuid := public.current_driver_id();
  v_n      integer;
begin
  if v_driver is null then
    raise exception 'Your rider account is not approved yet' using errcode = '42501';
  end if;

  update public.bookings b
  set driver_id = null, status = 'new'
  where b.id = p_booking and b.driver_id = v_driver and b.status = 'driver_assigned';
  get diagnostics v_n = row_count;
  return v_n = 1;
end;
$$;

-- Finish a ride and record the price agreed with the customer.
create function public.rider_complete(p_booking uuid, p_fare integer)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_driver uuid := public.current_driver_id();
  v_n      integer;
begin
  if v_driver is null then
    raise exception 'Your rider account is not approved yet' using errcode = '42501';
  end if;
  if p_fare is null or p_fare not between 0 and 100000 then
    raise exception 'Enter the price you agreed (in rupees)' using errcode = '22023';
  end if;

  update public.bookings b
  set status = 'completed', fare = p_fare
  where b.id = p_booking and b.driver_id = v_driver and b.status = 'driver_assigned';
  get diagnostics v_n = row_count;
  return v_n = 1;
end;
$$;

-- Customer did not show up, or cancelled.
create function public.rider_cancel(p_booking uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_driver uuid := public.current_driver_id();
  v_n      integer;
begin
  if v_driver is null then
    raise exception 'Your rider account is not approved yet' using errcode = '42501';
  end if;

  update public.bookings b
  set status = 'cancelled'
  where b.id = p_booking and b.driver_id = v_driver and b.status = 'driver_assigned';
  get diagnostics v_n = row_count;
  return v_n = 1;
end;
$$;

-- Show or hide this rider in the public "available riders" list.
create function public.rider_set_available(p_available boolean)
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

  update public.drivers d set is_available = coalesce(p_available, false) where d.id = v_driver;
  return coalesce(p_available, false);
end;
$$;

-- Permissions: public functions stay public; rider functions need a signed-in user.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.get_available_riders() to anon, authenticated;
grant execute on function public.request_ride(text, text, text, text, text, integer, timestamptz, text, integer) to anon, authenticated;
grant execute on function public.submit_partner_enquiry(text, text, text, text) to anon, authenticated;
grant execute on function public.rider_me() to authenticated;
grant execute on function public.rider_requests() to authenticated;
grant execute on function public.rider_accept(uuid) to authenticated;
grant execute on function public.rider_release(uuid) to authenticated;
grant execute on function public.rider_complete(uuid, integer) to authenticated;
grant execute on function public.rider_cancel(uuid) to authenticated;
grant execute on function public.rider_set_available(boolean) to authenticated;
