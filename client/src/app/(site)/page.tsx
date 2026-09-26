import Link from "next/link";
import { CtaBand, GreenHero, SiteFooter, SitePage, eyebrow } from "@/components/site/chrome";
import { PlanCards } from "@/components/site/plans";

// Sample figures from the design, not real data.
const ACCOUNTS = [
  { color: "bg-leaf", name: "Trade Republic", meta: "Cuenta e inversión", amount: "15.072,18 €", share: "62 %" },
  { color: "bg-sage", name: "BBVA", meta: "Cuenta corriente", amount: "8.566,24 €", share: "35 %" },
  { color: "bg-sage-light", name: "Efectivo", meta: "Manual", amount: "680,00 €", share: "3 %" },
];

const STEPS = [
  ["01", "Conecta tus bancos", "Tantos como uses, vía PSD2. Acceso de solo lectura: mypocket nunca puede mover tu dinero."],
  ["02", "Añade tu efectivo", "Lleva un balance de cash y registra ingresos y salidas manuales. Lo que no pasa por el banco también cuenta."],
  ["03", "Mira el total", "Un número con todo tu dinero, desglosado por cuenta para que nunca pierdas el detalle."],
];

const icon = { width: 30, height: 30, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "square" as const, "aria-hidden": true };

const FEATURES = [
  {
    title: "Analíticas",
    text: "Gasto por categoría, por cuenta o de todo junto. Filtra como quieras y compara periodos.",
    icon: <svg {...icon}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
  },
  {
    title: "Resumen del mes",
    text: "Cada mes, lo que entró, lo que salió y en qué se fue, sin tener que buscarlo.",
    icon: <svg {...icon}><rect x="3" y="5" width="18" height="16" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
  },
  {
    title: "Predicciones",
    text: "Una estimación de cómo acabarás el mes según tus ingresos, gastos y pagos recurrentes.",
    icon: <svg {...icon}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>,
  },
  {
    title: "Suscripciones",
    text: "Todos tus pagos recurrentes en una lista, con lo que te cuestan al mes y cuándo se renuevan.",
    icon: <svg {...icon}><path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 4v4h-4" /><path d="M12 8v4l3 2" /></svg>,
  },
];

const TICKET = [["Leche", "3,48"], ["Pan", "1,20"], ["Fruta", "6,85"], ["Pasta", "2,10"], ["Café", "9,77"]];

const arrow = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const h2 = "m-0 text-5xl font-extrabold leading-[0.95] tracking-[-0.045em] lg:text-[64px]";

export default function LandingPage() {
  return (
    <SitePage>
      <GreenHero className="pb-20 lg:pb-28">
        <div className="grid grid-cols-1 items-center gap-12 pt-16 lg:grid-cols-12 lg:gap-x-6 lg:pt-24">
          <div className="flex flex-col gap-8 lg:col-span-7">
            <div className={eyebrow}>TODAS TUS CUENTAS — UN SOLO BALANCE</div>
            <h1 className="m-0 text-6xl font-extrabold leading-[0.9] tracking-[-0.055em] sm:text-8xl lg:text-[112px]">
              Todo tu dinero, en un único sitio.
            </h1>
            <p className="m-0 max-w-[520px] text-xl leading-normal text-mist">
              Conecta tus bancos, añade tu efectivo y mira cuánto tienes de verdad. Un balance total, sin perder de vista de dónde viene cada euro.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link href="/register" className="btn inline-flex h-14 items-center gap-2.5 bg-cream px-7 text-base font-semibold text-brand hover:no-underline">
                Crear cuenta {arrow}
              </Link>
              <Link href="#how-it-works" className="btn inline-flex h-14 items-center border border-cream/50 px-7 text-base font-medium hover:no-underline">
                Ver cómo funciona
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-6 bg-paper p-6 text-ink sm:p-8 lg:col-span-5 lg:col-start-8" aria-label="Ejemplo de balance">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <div className="font-mono text-xs tracking-[0.06em] text-ink-muted">BALANCE TOTAL</div>
                <div className="font-mono text-4xl font-medium leading-none tracking-[-0.04em] sm:text-[44px]">24.318,42 €</div>
                <div className="font-mono text-[13px] text-leaf">+312,40 € este mes</div>
              </div>
              <div className="border border-ink px-2.5 py-1.5 font-mono text-xs">3 CUENTAS</div>
            </div>
            <div className="flex h-3 gap-[3px]" aria-hidden="true">
              <div className="grow-[62] bg-leaf" />
              <div className="grow-[35] bg-sage" />
              <div className="grow-[3] bg-sage-light" />
            </div>
            <div className="flex flex-col">
              {ACCOUNTS.map((a) => (
                <div key={a.name} className="flex items-center gap-3.5 border-t border-ink py-4">
                  <div className={`size-2.5 shrink-0 ${a.color}`} />
                  <div className="flex grow flex-col gap-0.5">
                    <div className="text-[17px] font-semibold">{a.name}</div>
                    <div className="text-[13px] text-ink-muted">{a.meta}</div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 font-mono">
                    <div className="text-base">{a.amount}</div>
                    <div className="text-xs text-ink-muted">{a.share}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/register" className="btn flex h-12 items-center justify-center gap-2 border border-dashed border-dash text-sm font-medium text-ink-muted hover:no-underline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Conectar otro banco
            </Link>
          </div>
        </div>
      </GreenHero>

      <section id="how-it-works" className="flex scroll-mt-4 flex-col gap-16 band py-20 lg:py-28">
        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
          <h2 className={`${h2} lg:col-span-7`}>Juntas, pero no revueltas.</h2>
          <p className="m-0 text-[17px] leading-[1.55] text-ink-muted lg:col-span-5 lg:col-start-8">
            Suma todas tus cuentas en un balance conjunto y entra en cada una cuando quieras saber de dónde sale qué.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map(([n, title, text]) => (
            <div key={n} className="flex flex-col gap-4 border-t-[3px] border-ink pt-6">
              <div className="text-[56px] font-extrabold leading-none tracking-[-0.04em] text-leaf">{n}</div>
              <h3 className="m-0 text-2xl font-semibold tracking-[-0.02em]">{title}</h3>
              <p className="m-0 text-base leading-[1.55] text-ink-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="flex scroll-mt-4 flex-col gap-12 band pb-20 lg:pb-28">
        <div className="flex flex-col justify-between gap-6 border-b-[3px] border-ink pb-6 lg:flex-row lg:items-end lg:gap-20">
          <h2 className={`${h2} max-w-[760px]`}>Entiende tu dinero. Adelántate a él.</h2>
          <div className="font-mono text-[13px] text-ink-muted">04 HERRAMIENTAS</div>
        </div>
        <div className="grid grid-cols-1 border border-ink sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <article
              key={f.title}
              className={`flex flex-col gap-5 px-7 py-8 text-leaf ${i < FEATURES.length - 1 ? "border-b border-ink lg:border-b-0 lg:border-r" : ""} ${i % 2 === 0 ? "sm:border-r" : ""}`}
            >
              {f.icon}
              <h3 className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-ink">{f.title}</h3>
              <p className="m-0 text-[15px] leading-[1.55] text-ink-muted">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="tickets" className="grid scroll-mt-4 grid-cols-1 items-center gap-12 bg-band band py-20 lg:grid-cols-12 lg:gap-x-6 lg:py-28">
        <div className="flex flex-col gap-7 lg:col-span-5">
          <div className={`${eyebrow} text-ink-muted`}>LECTOR DE TICKETS · OCR</div>
          <h2 className={h2}>Haz una foto. Nosotros lo cuadramos.</h2>
          <p className="m-0 text-[17px] leading-[1.55] text-ink-muted">
            El OCR lee el comercio, la fecha y el importe del ticket y busca la transacción que le corresponde en tus bancos.
          </p>
          <ul className="m-0 flex list-none flex-col p-0 text-base">
            <li className="flex items-center gap-3.5 border-t border-ink py-3.5">
              <span className="font-mono text-xs text-leaf">A.</span>Si la encuentra, lo vincula a esa transacción
            </li>
            <li className="flex items-center gap-3.5 border-y border-ink py-3.5">
              <span className="font-mono text-xs text-leaf">B.</span>Si pagaste en efectivo, crea la salida de cash por ti
            </li>
          </ul>
        </div>

        <div className="flex flex-col items-center gap-7 sm:flex-row sm:justify-end lg:col-span-6 lg:col-start-7" aria-hidden="true">
          <div className="flex w-[200px] -rotate-3 flex-col gap-2.5 border border-rule bg-white px-5 py-7 font-mono text-xs text-[#2A2F28]">
            <div className="text-center text-[13px] font-medium">MERCADONA</div>
            <div className="text-center text-ink-muted">22/09/2026 · 18:42</div>
            <div className="my-1.5 border-t border-dashed border-dash" />
            {TICKET.map(([item, price]) => (
              <div key={item} className="flex justify-between"><span>{item}</span><span>{price}</span></div>
            ))}
            <div className="my-1.5 border-t border-dashed border-dash" />
            <div className="flex justify-between text-sm font-medium"><span>TOTAL</span><span>23,40</span></div>
          </div>

          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" className="shrink-0 rotate-90 sm:rotate-0">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>

          <div className="flex w-full max-w-[260px] flex-col gap-4">
            <div className="flex flex-col gap-3.5 bg-brand p-[22px] text-cream">
              <div className="font-mono text-[11px] tracking-[0.06em]">COINCIDENCIA ENCONTRADA</div>
              <div className="flex items-baseline gap-3">
                <div className="flex grow flex-col gap-0.5">
                  <div className="text-[17px] font-semibold">Mercadona</div>
                  <div className="text-[13px] text-mist">BBVA · 22 sep</div>
                </div>
                <div className="font-mono text-[15px]">−23,40 €</div>
              </div>
              <div className="flex h-11 items-center justify-center bg-cream text-sm font-semibold text-brand">Vincular ticket</div>
            </div>
            <div className="flex flex-col gap-3.5 border border-ink bg-paper p-[22px]">
              <div className="text-[15px] text-ink-muted">¿Pagaste en efectivo?</div>
              <div className="flex h-11 items-center justify-center border border-ink text-sm font-semibold">Crear salida de efectivo</div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="flex flex-col gap-12 band py-20 lg:py-28">
        <div className="flex flex-col justify-between gap-4 border-b-[3px] border-ink pb-6 lg:flex-row lg:items-end">
          <h2 className={h2}>Precios claros</h2>
          <div className="font-mono text-[13px] text-ink-muted">EMPIEZA GRATIS · CAMBIA CUANDO QUIERAS</div>
        </div>
        <PlanCards />
      </section>

      <CtaBand centered />
      <SiteFooter />
    </SitePage>
  );
}
