// Functional skeleton: the visual design comes from Claude Design.
import { requestPasswordReset } from "../login/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <main>
      <h1>Recuperar contraseña</h1>
      {message && <p role="status">{message}</p>}
      <form action={requestPasswordReset}>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <button>Enviar enlace</button>
      </form>
    </main>
  );
}
