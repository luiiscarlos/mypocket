# MyPocket

Gestor de finanzas personales: transacciones, suscripciones y lectura bancaria PSD2 (Enable Banking).

Monorepo Turborepo + pnpm:

- `client/` — Next.js 16 + Tailwind + shadcn/ui → Vercel
- `api/` — GraphQL Yoga → Render
- `supabase/migrations/` — esquema de Postgres (Supabase)

## Desarrollo

```bash
pnpm install
cp client/.env.example client/.env.local   # rellenar
cp api/.env.example api/.env               # rellenar
pnpm dev                                   # client :3000, api :4000/graphql
```

## Despliegue

**API (Render):** New → Blueprint → este repo. Usa `render.yaml`; pide `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`.

> Plan gratuito de Render: el servicio se duerme tras 15 min sin tráfico y la primera petición tarda ~30–60 s (cold start).

**Client (Vercel):** New Project → este repo → Root Directory `client`. Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

**Supabase:** Auth → URL Configuration → Site URL = dominio de Vercel; añadir `https://<dominio>/**` y `http://localhost:3000/**` a Redirect URLs.
