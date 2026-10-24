# Indo Tuk Tuk

Tuk tuk rides and temple tours in Khajuraho. Built with Next.js (App Router), Tailwind CSS and Supabase.

- `/` home page with the ride request form
- `/khajuraho-temple-tour`, `/khajuraho-airport-transfer` and six more: search-friendly landing pages (content in `lib/seo-pages.ts`)
- `/rider` rider login and request inbox (riders are approved by adding their email to the `drivers` table)

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

Optional settings (defaults are in `lib/config.ts`): `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Database

SQL migrations are in `supabase/migrations`. The rider and booking functions are the only things the website can call; tables stay private.

To approve a rider: `insert into drivers (name, phone, email) values ('Name', '+91XXXXXXXXXX', 'rider@example.com');`
Then they sign up at `/rider` with that email.
