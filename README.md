# Indian Idol live sessions

The admin page and participant page use a shared Upstash Redis database, so the
live question and response totals are available across devices.

## Vercel setup

1. Add an Upstash Redis database to the Vercel project using the Vercel
   Marketplace integration.
2. Make sure the project has these environment variables for the deployment
   environments you use:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Redeploy the project after adding the integration or changing its variables.

The Vercel integration can add these variables automatically. For local
development, copy `.env.example` to `.env.local`, fill in the values from
Upstash, and run the project with `vercel dev` so the `/api/session` function is
available. Do not commit real credentials.

The app currently supports one shared live session per Redis database. Open
the deployed `/admin` page to start or end it, and share the deployed `/session`
page with participants on any device.
