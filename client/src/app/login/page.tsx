import { Button } from "@/components/ui/button";
import { login, signup } from "./actions";

const inputClass = "w-full rounded-md border px-3 py-2 text-sm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">MyPocket</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
      <form className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input name="email" type="email" autoComplete="email" required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contraseña
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={6}
            required
            className={inputClass}
          />
        </label>
        <Button formAction={login}>Entrar</Button>
        <Button formAction={signup} variant="outline">
          Crear cuenta
        </Button>
      </form>
    </main>
  );
}
