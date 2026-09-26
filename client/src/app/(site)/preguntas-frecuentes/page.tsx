import type { Metadata } from "next";
import Link from "next/link";
import { GreenHero, SiteFooter, SitePage, eyebrow } from "@/components/site/chrome";

export const metadata: Metadata = { title: "Preguntas frecuentes" };

// Bracketed answers are pending texts from the design.
const GROUPS: [string, [string, string][]][] = [
  [
    "Bancos y seguridad",
    [
      ["¿Es seguro conectar mi banco?", "La conexión se hace vía PSD2 con acceso de solo lectura: mypocket puede ver tus saldos y movimientos, pero nunca mover tu dinero."],
      ["¿Qué bancos puedo conectar?", "[LISTA DE BANCOS COMPATIBLES]"],
      ["¿Puedo conectar varios bancos a la vez?", "Sí. El balance conjunto suma todas tus cuentas y cada una mantiene su balance individual. El plan Gratis incluye 1 banco; Pro, ilimitados."],
      ["¿Cómo desconecto un banco?", "[PASOS PARA DESCONECTAR UN BANCO]"],
    ],
  ],
  [
    "Efectivo y movimientos",
    [
      ["¿Cómo llevo mi efectivo?", "Con un balance de cash en el que registras ingresos y salidas manuales. Se suma a tu balance total como una cuenta más."],
      ["¿Puedo usar mypocket sin conectar ningún banco?", "Sí. Puedes llevar tu balance de efectivo y registrar ingresos y salidas manuales, y conectar un banco cuando quieras."],
    ],
  ],
  [
    "Tickets",
    [
      ["¿Cómo funciona el lector de tickets?", "Haces una foto del ticket, el OCR lee el comercio, la fecha y el importe, y busca la transacción que le corresponde en tus bancos para vincularlo."],
      ["¿Y si pagué en efectivo?", "Si no hay una transacción bancaria que coincida, puedes crear con el ticket una salida de efectivo."],
    ],
  ],
  [
    "Planes y pagos",
    [
      ["¿Qué incluye el plan Gratis?", "1 banco conectado, balance de efectivo con movimientos manuales y resumen del mes."],
      ["¿Puedo cancelar Pro cuando quiera?", "[POLÍTICA DE CANCELACIÓN]"],
      ["¿Qué métodos de pago aceptáis?", "[MÉTODOS DE PAGO]"],
    ],
  ],
  [
    "Cuenta y privacidad",
    [
      ["¿Quién puede ver mis datos?", "[QUIÉN ACCEDE A LOS DATOS]"],
      ["¿Cómo borro mi cuenta?", "[PASOS PARA BORRAR LA CUENTA]"],
    ],
  ],
];

const groups = GROUPS.map(([title, items], i) => ({ id: `g${i + 1}`, n: String(i + 1).padStart(2, "0"), title, items }));

export default function FaqPage() {
  return (
    <SitePage>
      <GreenHero current="preguntas" className="pb-16 lg:pb-20">
        <div className="grid grid-cols-1 items-end gap-8 pt-16 lg:grid-cols-12 lg:gap-x-6 lg:pt-20">
          <div className="flex flex-col gap-7 lg:col-span-8">
            <div className={eyebrow}>AYUDA</div>
            <h1 className="m-0 text-6xl font-extrabold leading-[0.9] tracking-[-0.055em] sm:text-8xl lg:text-[112px]">
              Preguntas frecuentes
            </h1>
          </div>
          <p className="m-0 text-[19px] leading-normal text-mist lg:col-span-4 lg:col-start-9">
            Lo que suele preguntarse sobre bancos, efectivo, tickets y planes.
          </p>
        </div>
      </GreenHero>

      <section className="grid grow grid-cols-1 items-start gap-12 px-5 py-20 lg:grid-cols-12 lg:gap-x-6 lg:px-20 lg:py-24">
        <nav aria-label="Categorías" className="flex flex-col border-t-[3px] border-ink lg:sticky lg:top-6 lg:col-span-3">
          {groups.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="flex justify-between border-b border-rule py-3.5 text-base hover:underline">
              <span className="flex gap-3.5">
                <span className="pt-[3px] font-mono text-xs text-brand">{g.n}</span>
                {g.title}
              </span>
              <span className="pt-[3px] font-mono text-xs text-ink-muted">{g.items.length}</span>
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-[72px] lg:col-span-8 lg:col-start-5">
          {groups.map((g, gi) => (
            <section key={g.id} id={g.id} className="flex scroll-mt-6 flex-col">
              <h2 className="mb-5 mt-0 flex items-baseline gap-5 text-4xl font-extrabold tracking-[-0.04em]">
                <span className="font-mono text-sm font-medium tracking-normal text-brand">{g.n}</span>
                {g.title}
              </h2>
              {g.items.map(([q, a], qi) => (
                <details key={q} open={gi === 0 && qi === 0} className="group border-t border-ink">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-5 text-xl font-semibold tracking-[-0.01em] [&::-webkit-details-marker]:hidden">
                    {q}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" aria-hidden="true" className="shrink-0 text-brand transition-transform group-open:rotate-45">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </summary>
                  <p className="mb-6 mt-0 max-w-[720px] text-base leading-[1.65] text-ink-muted">{a}</p>
                </details>
              ))}
              <div className="border-t border-ink" />
            </section>
          ))}
        </div>
      </section>

      <section className="flex flex-col justify-between gap-8 bg-band px-5 py-16 sm:flex-row sm:items-center lg:p-20">
        <div className="flex flex-col gap-3">
          <h2 className="m-0 text-4xl font-extrabold leading-[0.95] tracking-[-0.045em] lg:text-5xl">¿No encuentras tu respuesta?</h2>
          <p className="m-0 text-[17px] text-ink-muted">Escríbenos y te respondemos por email.</p>
        </div>
        <Link href="/contacto" className="inline-flex h-14 shrink-0 items-center self-start bg-brand px-7 text-base font-semibold text-cream hover:no-underline sm:self-auto">
          Contactar
        </Link>
      </section>

      <SiteFooter />
    </SitePage>
  );
}
