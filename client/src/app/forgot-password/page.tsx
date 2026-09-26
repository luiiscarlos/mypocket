import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, Notice, inputClass, labelClass, primaryButton } from "@/components/site/auth";
import { requestPasswordReset } from "../login/actions";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;

  return (
    <AuthShell kicker="TU CUENTA" title="Recuperar contraseña" intro="Te enviaremos un enlace para crear una nueva.">
      {message && <Notice kind="status">{message}</Notice>}
      <form action={requestPasswordReset} className="flex flex-col gap-5">
        <label className={labelClass}>
          Email
          <input name="email" type="email" autoComplete="email" required className={inputClass} />
        </label>
        <button className={primaryButton}>Enviar enlace</button>
      </form>
      <Link href="/login" className="text-[15px] font-semibold underline">
        ← Volver a iniciar sesión
      </Link>
    </AuthShell>
  );
}
