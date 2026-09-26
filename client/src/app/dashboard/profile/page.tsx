// Functional skeleton: the visual design comes from Claude Design. Keep field names and actions.
import { requireUser } from "@/lib/auth";
import { gql } from "@/lib/api";
import { changePassword, deleteAccount, updateProfile } from "./actions";

type Me = { email: string | null; displayName: string | null; currency: string; readOnly: boolean };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  await requireUser();
  const { error, message } = await searchParams;
  const { me } = await gql<{ me: Me }>("{ me { email displayName currency readOnly } }");

  return (
    <main>
      <h1>Perfil</h1>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <p>{me.email}</p>

      <form action={updateProfile}>
        <label>
          Nombre
          <input name="displayName" defaultValue={me.displayName ?? ""} maxLength={50} />
        </label>
        <label>
          Moneda
          <input name="currency" defaultValue={me.currency} pattern="[A-Za-z]{3}" maxLength={3} required />
        </label>
        <button disabled={me.readOnly}>Guardar</button>
      </form>

      <h2>Cambiar contraseña</h2>
      <form action={changePassword}>
        <label>
          Contraseña actual
          <input name="current" type="password" autoComplete="current-password" required />
        </label>
        <label>
          Nueva contraseña
          <input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </label>
        <label>
          Repítela
          <input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </label>
        <button disabled={me.readOnly}>Cambiar</button>
      </form>

      <h2>Tus datos</h2>
      <a href="/dashboard/profile/export" download>
        Descargar mis datos (JSON)
      </a>

      <h2>Borrar cuenta</h2>
      <p>Se borran tu cuenta y todos tus datos de forma permanente.</p>
      <form action={deleteAccount}>
        <label>
          Escribe BORRAR para confirmar
          <input name="confirm" required autoComplete="off" />
        </label>
        <button disabled={me.readOnly}>Borrar mi cuenta</button>
      </form>
    </main>
  );
}
