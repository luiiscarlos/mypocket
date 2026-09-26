import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, Notice, TextLink, inputClass, labelClass, primaryButton } from "@/components/site/auth";
import { signup } from "../login/actions";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <AuthShell
      kicker="EMPIEZA GRATIS"
      title="Crear cuenta"
      intro={<>¿Ya tienes cuenta? <TextLink href="/login">Iniciar sesión</TextLink></>}
    >
      {error && <Notice kind="error">{error}</Notice>}
      <form action={signup} className="flex flex-col gap-5">
        <label className={labelClass}>
          Email
          <input name="email" type="email" autoComplete="email" required className={inputClass} />
        </label>
        <label className={labelClass}>
          Contraseña
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            aria-describedby="pw-hint"
            className={inputClass}
          />
          <span id="pw-hint" className="text-[13px] font-normal text-ink-muted">Mínimo 8 caracteres</span>
        </label>
        <div className="flex items-start gap-3 text-sm leading-normal text-ink-muted">
          <input id="terms" type="checkbox" name="terms" required className="size-5 shrink-0 accent-brand" />
          <label htmlFor="terms">
            Acepto los{" "}
            <Link href="/terminos" className="text-ink underline">términos de uso</Link> y la{" "}
            <Link href="/privacidad" className="text-ink underline">política de privacidad</Link>
          </label>
        </div>
        <button className={primaryButton}>Crear cuenta</button>
      </form>
    </AuthShell>
  );
}
