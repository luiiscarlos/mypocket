// Functional skeleton: shows the data the dashboard needs. The visual design comes from Claude Design.
import { requireUser } from "@/lib/auth";
import { gql } from "@/lib/api";
import { logout } from "../login/actions";

type DashboardData = {
  me: { email: string | null; displayName: string | null; readOnly: boolean; isOwner: boolean };
  monthlySummary: {
    month: string;
    isEmpty: boolean;
    totals: { currency: string; income: number; expense: number; balance: number }[];
    byCategory: { category: { name: string } | null; type: string; currency: string; total: number }[];
  };
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  await requireUser();
  const { message } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const { me, monthlySummary: summary } = await gql<DashboardData>(
    `query Dashboard($month: String!) {
      me { email displayName readOnly isOwner }
      monthlySummary(month: $month) {
        month isEmpty
        totals { currency income expense balance }
        byCategory { category { name } type currency total }
      }
    }`,
    { month: today },
  );

  return (
    <main>
      <h1>Dashboard</h1>
      {message && <p role="status">{message}</p>}
      <p>{me.displayName ?? me.email}{me.readOnly && " (demo, solo lectura)"}</p>

      <h2>{summary.month}</h2>
      {summary.isEmpty ? (
        <p>Aún no hay movimientos este mes.</p>
      ) : (
        <>
          <ul>
            {summary.totals.map((t) => (
              <li key={t.currency}>
                {t.currency}: ingresos {t.income}, gastos {t.expense}, balance {t.balance}
              </li>
            ))}
          </ul>
          <ul>
            {summary.byCategory.map((c, i) => (
              <li key={i}>
                {c.category?.name ?? "Sin categoría"} ({c.type}): {c.total} {c.currency}
              </li>
            ))}
          </ul>
        </>
      )}

      <form action={logout}>
        <button>Cerrar sesión</button>
      </form>
    </main>
  );
}
