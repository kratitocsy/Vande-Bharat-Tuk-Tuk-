-- Javari Temple (Eastern Group) as a pickup / drop-off point.
insert into public.places (slug, name, kind, lat, lng, sort_order)
values ('javari-temple', 'Javari Temple', 'temple', 24.8452, 79.9352, 65)
on conflict (slug) do nothing;
