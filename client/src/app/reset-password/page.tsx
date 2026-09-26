import type { Metadata } from "next";
import { AuthShell, Notice, inputClass, labelClass, primaryButton } from "@/components/site/auth";
import { requireUser } from "@/lib/auth";
import { updatePassword } from "../login/actions";

export const metadata: Metadata = { title: "Nueva contraseña" };

// Reached from the recovery email via /auth/confirm, which opens a recovery session.
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser();
  const { error } = await searchParams;

  return (
    <AuthShell
      kicker="TU CUENTA"
      title="Nueva contraseña"
      intro="Elige una contraseña de al menos 8 caracteres."
      tagline="Un paso más y vuelves a tu balance."
    >
      {error && <Notice kind="error">{error}</Notice>}
      <form action={updatePassword} className="flex flex-col gap-5">
        <label className={labelClass}>
          Nueva contraseña
          <input name="password" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
        </label>
        <label className={labelClass}>
          Repite la contraseña
          <input name="confirm" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
        </label>
        <button className={primaryButton}>Guardar contraseña</button>
      </form>
    </AuthShell>
  );
}
