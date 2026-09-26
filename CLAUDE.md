# mypocket

## Convención de mensajes de commit

Formato: `<acción>(<lugar>): <descripción>`

**Acciones:** `feat` `fix` `refactor` `style` `docs` `test` `chore` `perf` `ci`

**Lugares** (ruta/sección real del proyecto, no el nombre de un componente interno):

- Landing (sitio público y páginas de acceso: `/`, precios, preguntas, contacto, legal, login, registro, recuperar/nueva contraseña): `landing`
- Dashboard: `dashboard`, `dashboard-transactions`, `dashboard-subscriptions`, `dashboard-receipts`
- Mobile/PWA: `mobile`, `mobile-transactions`, `mobile-subscriptions`, `mobile-receipts`
- API: `api`, `api-transactions`, `api-subscriptions`, `api-receipts`, `api-auth`
- Packages: `graphql-schema`, `supabase-client`, `config`
- Todo el repo por igual: `repo`

Usa el nombre del proyecto solo (`dashboard`, `mobile`, `landing`, `api`) cuando el cambio es transversal (layout raíz, configuración global, providers, auth general).

Varios lugares a la vez → sepáralos por comas: `feat(api-transactions,dashboard-transactions): ...`. Solo como excepción; si ocurre a menudo, el commit probablemente debería dividirse.

Descripción en minúscula, imperativo/infinitivo ("añadir", no "añadido"/"añadiendo"), breve, sin punto final.

**Ejemplos:**

```
feat(api-transactions): añadir mutation createTransaction
fix(dashboard-subscriptions): corregir cálculo de gasto mensual normalizado
feat(landing): añadir tabla comparativa de planes
refactor(supabase-client): centralizar tipos generados de la base de datos
chore(repo): actualizar dependencias de Turborepo
```
