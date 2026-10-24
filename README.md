# Indo Tuk Tuk

Tuk tuk rides and temple tours in Khajuraho. Built with Next.js (App Router), Tailwind CSS and Supabase.

- `/` home page with the ride request form
- `/khajuraho-temple-tour`, `/khajuraho-airport-transfer` and six more: search-friendly landing pages (content in `lib/seo-pages.ts`)
- `/rider` rider login and request inbox (riders are approved by adding their email to the `drivers` table); riders can share their live location
- `/track` customers follow their rider with the request code and phone number
- Map: Mappls (MapmyIndia) web SDK, loaded in the browser with `NEXT_PUBLIC_MAPPLS_MAP_KEY`. If it cannot load, the form falls back to the dropdown lists.
- `/api/route` (road distance and time) and `/api/geocode` (address search) run on the server with `MAPPLS_CLOUD_KEY`

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

Settings: `NEXT_PUBLIC_MAPPLS_MAP_KEY` (public, restrict by domain in Mappls), `MAPPLS_CLOUD_KEY` (server only). Optional: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (defaults in `lib/config.ts`).

## Database

SQL migrations are in `supabase/migrations`. The rider and booking functions are the only things the website can call; tables stay private.

To approve a rider: `insert into drivers (name, phone, email) values ('Name', '+91XXXXXXXXXX', 'rider@example.com');`
Then they sign up at `/rider` with that email.
