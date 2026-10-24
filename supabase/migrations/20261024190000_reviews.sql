-- Customer reviews: anyone can leave one; it shows on the website only after it is approved.
-- To approve (Supabase dashboard > SQL editor):
--   update public.reviews set status = 'approved' where id = '<review id>';
-- To hide one later: set status = 'hidden'.

create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  reviewer_name text not null check (char_length(reviewer_name) between 2 and 60),
  rating        smallint not null check (rating between 1 and 5),
  rider_name    text check (rider_name is null or char_length(rider_name) between 2 and 60),
  comment       text check (comment is null or char_length(comment) <= 600),
  status        text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  source_hash   text,                         -- hashed visitor address, only used to limit spam
  created_at    timestamptz not null default now()
);

create index reviews_status_created_idx on public.reviews (status, created_at desc);

-- No policies: the website reads and writes only through the two functions below.
alter table public.reviews enable row level security;

create function public.get_reviews()
returns table (reviewer_name text, rating smallint, rider_name text, comment text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.reviewer_name, r.rating, r.rider_name, r.comment, r.created_at
  from public.reviews r
  where r.status = 'approved'
  order by r.created_at desc
  limit 40;
$$;

create function public.submit_review(
  p_name    text,
  p_rating  integer,
  p_rider   text default null,
  p_comment text default null
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_name    text := nullif(trim(p_name), '');
  v_rider   text := nullif(trim(p_rider), '');
  v_comment text := nullif(trim(p_comment), '');
  v_hash    text;
begin
  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 60 then
    raise exception 'Add your name' using errcode = '22023';
  end if;
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Choose 1 to 5 stars' using errcode = '22023';
  end if;
  if v_rider is not null and (char_length(v_rider) < 2 or char_length(v_rider) > 60) then
    raise exception 'The rider name should be 2 to 60 letters' using errcode = '22023';
  end if;
  if v_comment is not null and char_length(v_comment) > 600 then
    raise exception 'Keep your review under 600 characters' using errcode = '22023';
  end if;
  if v_comment ~* '(https?://|www\.)' then
    raise exception 'Please leave out web links' using errcode = '22023';
  end if;

  -- A hashed visitor address, only to stop one person flooding the page.
  v_hash := md5(coalesce(
    nullif(current_setting('request.headers', true), '')::json ->> 'x-real-ip',
    nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for',
    'unknown'));

  if (select count(*) from public.reviews r
      where r.source_hash = v_hash and r.created_at > now() - interval '1 day') >= 3 then
    raise exception 'You have sent a few reviews today. Please try again tomorrow.' using errcode = '22023';
  end if;
  if (select count(*) from public.reviews r where r.status = 'pending' and r.created_at > now() - interval '1 hour') >= 40 then
    raise exception 'We are getting a lot of reviews right now. Please try again later.' using errcode = '22023';
  end if;

  insert into public.reviews (reviewer_name, rating, rider_name, comment, source_hash)
  values (v_name, p_rating, v_rider, v_comment, v_hash);
  return true;
end;
$$;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.get_available_riders() to anon, authenticated;
grant execute on function public.request_ride(text, text, text, text, text, integer, timestamptz, text, integer) to anon, authenticated;
grant execute on function public.request_ride_v2(text, text, text, text, text, integer, timestamptz, text, integer, double precision, double precision, double precision, double precision) to anon, authenticated;
grant execute on function public.submit_partner_enquiry(text, text, text, text) to anon, authenticated;
grant execute on function public.track_ride(text, text) to anon, authenticated;
grant execute on function public.get_reviews() to anon, authenticated;
grant execute on function public.submit_review(text, integer, text, text) to anon, authenticated;
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
