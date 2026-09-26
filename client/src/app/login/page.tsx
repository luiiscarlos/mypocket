// Functional skeleton: the visual design comes from Claude Design. Keep the form field names and actions.
import Link from "next/link";
import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { error, message, next } = await searchParams;

  return (
    <main>
      <h1>MyPocket</h1>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <form>
        <input type="hidden" name="next" value={next ?? ""} />
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Contraseña
          <input name="password" type="password" autoComplete="current-password" minLength={8} required />
        </label>
        <button formAction={login}>Entrar</button>
        <button formAction={signup}>Crear cuenta</button>
      </form>
      <Link href="/forgot-password">¿Has olvidado la contraseña?</Link>
    </main>
  );
}
