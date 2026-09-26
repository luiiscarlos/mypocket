import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { createYoga } from "graphql-yoga";
import { GraphQLError } from "graphql";
import { createClient } from "@supabase/supabase-js";
import { EnvelopArmorPlugin } from "@escape.tech/graphql-armor";
import { useDisableIntrospection } from "@graphql-yoga/plugin-disable-introspection";
import { schema, type Context } from "./schema.js";
import { rateLimit } from "./rate-limit.js";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

const url = env("SUPABASE_URL");
const publishableKey = env("SUPABASE_PUBLISHABLE_KEY");
const internalSecret = Buffer.from(env("INTERNAL_API_SECRET"));
if (internalSecret.length < 32) throw new Error("INTERNAL_API_SECRET debe tener al menos 32 caracteres");
const secretKey = process.env.SUPABASE_SECRET_KEY;
const ownerUserId = process.env.OWNER_USER_ID || null;
const corsOrigins = (process.env.CORS_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";

const noSession = { persistSession: false, autoRefreshToken: false };
// Long-lived so the JWKS used by getClaims stays cached across requests.
const verifier = createClient(url, publishableKey, { auth: noSession });
const admin = secretKey ? createClient(url, secretKey, { auth: noSession }) : null;

// Only our Next.js server (BFF) knows this secret; browsers never call the API directly.
function fromBff(request: Request) {
  const received = Buffer.from(request.headers.get("x-internal-secret") ?? "");
  return received.length === internalSecret.length && timingSafeEqual(received, internalSecret);
}

const httpError = (message: string, code: string, status: number, headers?: Record<string, string>) =>
  new GraphQLError(message, { extensions: { code, http: { status, headers } } });

const yoga = createYoga<{}, Context>({
  schema,
  graphiql: false,
  cors: corsOrigins.length > 0 ? { origin: corsOrigins, methods: ["POST"] } : false,
  plugins: [
    EnvelopArmorPlugin({
      maxDepth: { n: 6 },
      maxAliases: { n: 10 },
      maxDirectives: { n: 10 },
      maxTokens: { n: 1000 },
      costLimit: { maxCost: 5000 },
      blockFieldSuggestion: {},
    }),
    ...(isProduction ? [useDisableIntrospection()] : []),
  ],
  context: async ({ request }): Promise<Context> => {
    if (!fromBff(request)) throw httpError("No autorizado", "UNAUTHENTICATED", 401);

    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    let user: Context["user"] = null;
    if (token) {
      const { data, error } = await verifier.auth.getClaims(token);
      if (error || !data) throw httpError("Sesión inválida o caducada", "UNAUTHENTICATED", 401);
      user = {
        userId: data.claims.sub,
        email: typeof data.claims.email === "string" ? data.claims.email : null,
        token,
        db: createClient(url, publishableKey, {
          auth: noSession,
          global: { headers: { Authorization: `Bearer ${token}` } },
        }),
      };
    }

    // x-client-ip is trusted only because the request carried the BFF secret.
    const key = user ? `user:${user.userId}` : `ip:${request.headers.get("x-client-ip") ?? "unknown"}`;
    const retryAfter = rateLimit(key);
    if (retryAfter !== null) {
      throw httpError("Demasiadas peticiones, prueba en un momento", "RATE_LIMITED", 429, {
        "Retry-After": String(retryAfter),
      });
    }

    return { user, admin, ownerUserId };
  },
});

const port = Number(process.env.PORT) || 4000;
createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "text/plain" }).end("ok");
    return;
  }
  void yoga(req, res);
}).listen(port, () => {
  console.log(`GraphQL Yoga listening on http://localhost:${port}/graphql`);
});
