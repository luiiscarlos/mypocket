import type { Metadata } from "next";
import { CtaBand, GreenHero, SiteFooter, SitePage, eyebrow } from "@/components/site/chrome";
import { PlanCards } from "@/components/site/plans";

export const metadata: Metadata = { title: "Precios" };

const ROWS = [
  ["Bancos conectados", "1", "Ilimitados"],
  ["Balance conjunto e individual", "Sí", "Sí"],
  ["Balance de efectivo y movimientos manuales", "Sí", "Sí"],
  ["Resumen del mes", "Sí", "Sí"],
  ["Analíticas y predicciones", "—", "Sí"],
  ["Gestión de suscripciones", "—", "Sí"],
  ["Lector de tickets con OCR", "—", "Sí"],
];

const FAQS = [
  {
    q: "¿Es seguro conectar mi banco?",
    a: "La conexión se hace vía PSD2 con acceso de solo lectura: mypocket puede ver tus saldos y movimientos, pero nunca mover tu dinero.",
  },
  { q: "¿Qué bancos puedo conectar?", a: "[LISTA DE BANCOS COMPATIBLES]" },
  {
    q: "¿Puedo usar mypocket sin conectar ningún banco?",
    a: "Sí. Puedes llevar tu balance de efectivo y registrar ingresos y salidas manuales.",
  },
  { q: "¿Puedo cancelar Pro cuando quiera?", a: "[POLÍTICA DE CANCELACIÓN]" },
];

const h2 = "m-0 text-5xl font-extrabold leading-[0.95] tracking-[-0.045em] lg:text-[56px]";

export default function PricingPage() {
  return (
    <SitePage>
      <GreenHero current="precios" className="pb-20 lg:pb-24">
        <div className="grid grid-cols-1 items-end gap-8 pt-16 lg:grid-cols-12 lg:gap-x-6 lg:pt-24">
          <div className="flex flex-col gap-7 lg:col-span-7">
            <div className={eyebrow}>PRECIOS</div>
            <h1 className="m-0 text-6xl font-extrabold leading-[0.9] tracking-[-0.055em] sm:text-8xl lg:text-[112px]">
              Empieza gratis. Crece cuando quieras.
            </h1>
          </div>
          <p className="m-0 text-[19px] leading-normal text-mist lg:col-span-4 lg:col-start-9">
            Un banco y tu efectivo, gratis. Pasa a Pro para sumar todas tus cuentas en un balance conjunto.
          </p>
        </div>
      </GreenHero>

      <section className="px-5 py-20 lg:px-20 lg:py-28">
        <PlanCards />
      </section>

      <section className="flex flex-col gap-10 px-5 pb-20 lg:px-20 lg:pb-28">
        <div className="flex items-end justify-between border-b-[3px] border-ink pb-6">
          <h2 className={h2}>Comparativa</h2>
          <div className="font-mono text-[13px] text-ink-muted">GRATIS · PRO</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[17px]">
            <thead>
              <tr>
                <th scope="col" className="w-1/2 pb-4 text-left font-mono text-xs font-medium tracking-[0.06em] text-ink-muted">FUNCIÓN</th>
                <th scope="col" className="w-1/4 pb-4 text-left text-xl font-semibold">Gratis</th>
                <th scope="col" className="w-1/4 pb-4 text-left text-xl font-semibold text-brand">Pro</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, free, pro]) => (
                <tr key={label}>
                  <th scope="row" className="border-t border-rule py-[18px] text-left font-normal">{label}</th>
                  <td className="border-t border-rule py-[18px] font-mono text-[15px]">{free}</td>
                  <td className="border-t border-rule py-[18px] font-mono text-[15px]">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-10 bg-band px-5 py-20 lg:grid-cols-12 lg:gap-x-6 lg:px-20 lg:py-28">
        <h2 className={`${h2} lg:col-span-4`}>Preguntas frecuentes</h2>
        <div className="flex flex-col lg:col-span-7 lg:col-start-6">
          {FAQS.map((f, i) => (
            <details key={f.q} open={i === 0} className="border-t border-ink py-6">
              <summary className="cursor-pointer text-[21px] font-semibold tracking-[-0.01em]">{f.q}</summary>
              <p className="mb-0 mt-3.5 text-base leading-relaxed text-ink-muted">{f.a}</p>
            </details>
          ))}
          <div className="border-t border-ink" />
        </div>
      </section>

      <CtaBand />
      <SiteFooter />
    </SitePage>
  );
}
