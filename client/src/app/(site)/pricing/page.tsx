import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, GreenHero, SiteFooter, SitePage, eyebrow } from "@/components/site/chrome";
import { PRO_PRICE } from "@/components/site/plans";

export const metadata: Metadata = { title: "Precios" };

type Cell = true | string;
type Row = { group: string } | { label: string; free: Cell; pro: Cell };

const ROWS: Row[] = [
  { group: "CUENTAS Y BALANCE" },
  { label: "Bancos conectados", free: "1", pro: "Ilimitados" },
  { label: "Balance conjunto e individual", free: true, pro: true },
  { label: "Balance de efectivo y movimientos manuales", free: true, pro: true },
  { group: "ANÁLISIS" },
  { label: "Resumen del mes", free: true, pro: true },
  { label: "Analíticas", free: "—", pro: true },
  { label: "Predicciones", free: "—", pro: true },
  { group: "AUTOMATIZACIÓN" },
  { label: "Gestión de suscripciones", free: "—", pro: true },
  { label: "Lector de tickets con OCR", free: "—", pro: true },
];

const TRUST = [
  ["Solo lectura", "Conectamos tus bancos vía PSD2. Podemos leer saldos y movimientos, nunca mover tu dinero."],
  ["Sin banco, también", "Puedes empezar solo con tu efectivo y movimientos manuales, y conectar un banco después."],
  ["Cambia de plan", "Pasa de Gratis a Pro, o al revés, cuando quieras. [CONDICIONES DE CAMBIO]"],
];

const grid = "grid grid-cols-[6fr_3fr_3fr]";

function Check({ light = false }: { light?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={light ? "text-cream" : "text-ink"} strokeWidth="2.4" strokeLinecap="square" role="img" aria-label="Incluido">
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <SitePage>
      <GreenHero current="pricing" className="pb-16 lg:pb-20">
        <div className="grid grid-cols-1 items-end gap-8 pt-16 lg:grid-cols-12 lg:gap-x-6 lg:pt-20">
          <div className="flex flex-col gap-7 lg:col-span-8">
            <div className={eyebrow}>PRECIOS</div>
            <h1 className="m-0 text-6xl font-extrabold leading-[0.9] tracking-[-0.055em] sm:text-8xl lg:text-[112px]">
              Dos planes.
              <br />
              Sin letra pequeña.
            </h1>
          </div>
          <p className="m-0 text-[19px] leading-normal text-mist lg:col-span-4 lg:col-start-9">
            Un banco y tu efectivo, gratis. Pasa a Pro para sumar todas tus cuentas en un balance conjunto.
          </p>
        </div>
      </GreenHero>

      <section className="band py-20 lg:py-28">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]" role="table" aria-label="Comparativa de planes">
            <div className={grid} role="row">
              <div role="columnheader" className="flex flex-col justify-end gap-3 border-b-[3px] border-ink pb-10 pr-8">
                <div className={`${eyebrow} text-ink-muted`}>COMPARA LOS PLANES</div>
                <div className="max-w-[420px] text-[17px] leading-normal text-ink-muted">
                  Los dos incluyen el balance conjunto y tu efectivo. Pro desbloquea todas las cuentas y el análisis.
                </div>
              </div>
              <div role="columnheader" className="flex flex-col gap-5 border-b-[3px] border-ink p-8 lg:py-10">
                <div className="text-[30px] font-extrabold tracking-[-0.03em]">Gratis</div>
                <div className="font-mono text-5xl font-medium leading-none tracking-[-0.05em]">
                  0 €<span className="text-sm tracking-normal text-ink-muted"> /mes</span>
                </div>
                <div className="text-[15px] text-ink-muted">Para empezar a ordenar tu dinero.</div>
                <Link href="/register" className="btn flex h-[52px] items-center justify-center border border-ink text-[15px] font-semibold hover:no-underline">
                  Empezar gratis
                </Link>
              </div>
              <div role="columnheader" className="flex flex-col gap-5 border-b-[3px] border-ink bg-brand p-8 text-cream lg:py-10">
                <div className="flex items-center justify-between">
                  <div className="text-[30px] font-extrabold tracking-[-0.03em]">Pro</div>
                  <div className="border border-cream/60 px-2 py-[5px] font-mono text-[11px] tracking-[0.06em]">RECOMENDADO</div>
                </div>
                <div className="font-mono text-5xl font-medium leading-none tracking-[-0.05em]">
                  {PRO_PRICE} €<span className="text-sm tracking-normal text-mist"> /mes</span>
                </div>
                <div className="text-[15px] text-mist">Todas tus cuentas, en un solo número.</div>
                <Link href="/register" className="btn flex h-[52px] items-center justify-center bg-cream text-[15px] font-semibold text-brand hover:no-underline">
                  Probar Pro
                </Link>
              </div>
            </div>

            {ROWS.map((row) =>
              "group" in row ? (
                <div key={row.group} className={grid} role="row">
                  <div role="rowheader" className="pb-3.5 pt-9 font-mono text-xs tracking-[0.06em] text-leaf">{row.group}</div>
                  <div role="cell" />
                  <div role="cell" className="bg-brand" />
                </div>
              ) : (
                <div key={row.label} className={`${grid} text-[17px]`} role="row">
                  <div role="rowheader" className="border-t border-rule py-[18px] pr-8">{row.label}</div>
                  <div role="cell" className="flex items-center border-t border-rule px-8 py-[18px] font-mono text-[15px]">
                    {row.free === true ? <Check /> : <span className={row.free === "—" ? "text-dash" : ""}>{row.free}</span>}
                  </div>
                  <div role="cell" className="flex items-center border-t border-cream/25 bg-brand px-8 py-[18px] font-mono text-[15px] text-cream">
                    {row.pro === true ? <Check light /> : <span>{row.pro}</span>}
                  </div>
                </div>
              ),
            )}

            <div className={grid} aria-hidden="true">
              <div className="border-t-[3px] border-ink" />
              <div className="border-t-[3px] border-ink" />
              <div className="h-8 border-t-[3px] border-ink bg-brand" />
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-12 bg-band band py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TRUST.map(([title, text]) => (
            <div key={title} className="flex flex-col gap-3.5 border-t-[3px] border-ink pt-6">
              <h3 className="m-0 text-2xl font-extrabold tracking-[-0.03em]">{title}</h3>
              <p className="m-0 text-base leading-[1.55] text-ink-muted">{text}</p>
            </div>
          ))}
        </div>
        <Link href="/faq" className="inline-flex items-center gap-2.5 self-start border-b-2 border-ink pb-1 text-[17px] font-semibold hover:no-underline">
          Ver todas las preguntas frecuentes
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </section>

      <CtaBand />
      <SiteFooter />
    </SitePage>
  );
}
