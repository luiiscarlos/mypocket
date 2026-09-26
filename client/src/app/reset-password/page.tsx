// Functional skeleton: the visual design comes from Claude Design.
// Reached from the recovery email via /auth/confirm, which opens a recovery session.
import { requireUser } from "@/lib/auth";
import { updatePassword } from "../login/actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;

  return (
    <main>
      <h1>Nueva contraseña</h1>
      {error && <p role="alert">{error}</p>}
      <form action={updatePassword}>
        <label>
          Nueva contraseña
          <input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </label>
        <label>
          Repítela
          <input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </label>
        <button>Guardar</button>
      </form>
    </main>
  );
}
