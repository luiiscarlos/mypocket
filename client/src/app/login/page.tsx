import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, Notice, TextLink, inputClass, labelClass, primaryButton } from "@/components/site/auth";
import { login } from "./actions";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { error, message, next } = await searchParams;

  return (
    <AuthShell
      kicker="TU CUENTA"
      title="Iniciar sesión"
      intro={<>¿No tienes cuenta? <TextLink href="/registro">Crear cuenta</TextLink></>}
    >
      {error && <Notice kind="error">{error}</Notice>}
      {message && <Notice kind="status">{message}</Notice>}
      <form action={login} className="flex flex-col gap-5">
        <input type="hidden" name="next" value={next ?? ""} />
        <label className={labelClass}>
          Email
          <input name="email" type="email" autoComplete="email" required className={inputClass} />
        </label>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm font-semibold">
            <label htmlFor="password">Contraseña</label>
            <Link href="/forgot-password" className="font-medium text-ink-muted underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
        </div>
        <button className={primaryButton}>Entrar</button>
      </form>
    </AuthShell>
  );
}
