# MyPocket

Gestor de finanzas personales: transacciones, suscripciones y lectura bancaria PSD2 (Enable Banking).

Monorepo Turborepo + pnpm:

- `client/` — Next.js 16 → Vercel. Hace de BFF: el navegador nunca llama a la API.
- `api/` — GraphQL Yoga → Render. Solo acepta peticiones del servidor Next, con `x-internal-secret`.
- `supabase/migrations/` — esquema de Postgres (Supabase)

## Entornos

| Entorno | Rama | Supabase | Web (Vercel) | API (Render) |
|---|---|---|---|---|
| development | `develop` | `mypocket-dev` | Preview | `mypocket-api` (`NODE_ENV=development`) |
| production | `main` | `mypocket` | Production | pendiente |

## Desarrollo

```bash
pnpm install
cp client/.env.example client/.env.dev   # rellenar con el proyecto Supabase dev
cp api/.env.example api/.env.dev         # mismo INTERNAL_API_SECRET que el cliente
pnpm dev                                 # client :3000, api :4000/graphql
```

`api/.env.prod` solo se usa para tareas puntuales contra producción, por ejemplo `pnpm --filter api seed:prod -- --demo ...`.

Pruebas y datos:
- **Smoke test** (API corriendo en local): `SMOKE_EMAIL=... SMOKE_PASSWORD=... pnpm --filter api smoke`
- **Seed de dev:** `pnpm --filter api seed -- --email ... --password ...`

## Despliegue

**API (Render):** Blueprint desde `render.yaml`. Las variables con `sync: false` se crean vacías, así que hay que rellenarlas antes del primer deploy.

> Plan gratuito de Render: el servicio se duerme tras 15 min sin tráfico y la primera petición tarda ~20–25 s (cold start medido: 22 s). En caliente responde en ~0,25 s.

**Client (Vercel):** Root Directory `client`. Variables por entorno:
- **Preview:** Supabase dev, `API_URL` e `INTERNAL_API_SECRET`.
- **Production:** Supabase prod.

**Supabase:** Auth → URL Configuration → Site URL y Redirect URLs (`http://localhost:3000/**` y los dominios de Vercel) en cada proyecto.
