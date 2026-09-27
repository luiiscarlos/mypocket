import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { completeOnboarding, setPlan, updateProfile } from "@/app/dashboard/actions";
import {
  ACCOUNT_FIELDS, AccountForm, AccountList, EXPENSE_FIELDS, ExpenseForm, ExpenseList, INVESTMENT_FIELDS, InvestmentList,
  InvestmentSearch, searchInstruments, type Account, type Category, type Expense, type Investment,
} from "@/components/app/finance";
import { PageNotice, ProUpsell, Section, smallButton } from "@/components/app/ui";
import { inputClass, labelClass, primaryButton } from "@/components/forms";
import { Logo, eyebrow } from "@/components/site/chrome";
import { gql } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";
import { appNotice } from "@/lib/auth-codes";

const STEPS = ["personal", "accounts", "investments", "expenses"] as const;
const PAGE = "/dashboard/onboarding";

type Me = {
  fullName: string | null; phone: string | null; addressLine: string | null; postalCode: string | null; city: string | null;
  country: string | null; birthDate: string | null; currency: string; plan: "FREE" | "PRO"; readOnly: boolean; onboardingCompleted: boolean;
};

export async function generateMetadata() {
  return { title: (await getTranslations("app.onboarding"))("title") };
}

export default async function OnboardingPage({ searchParams }: PageProps<"/dashboard/onboarding">) {
  await requireUser();
  const sp = await searchParams;
  const step = Math.min(Math.max(Number(sp.step) || 1, 1), STEPS.length);
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const back = `${PAGE}?step=${step}`;
  const nextStep = `${PAGE}?step=${step + 1}`;

  const [t, notice, data, search, pro] = await Promise.all([
    getTranslations("app.onboarding"),
    appNotice(sp as { error?: string; message?: string }),
    gql<{ me: Me; accounts: Account[]; investments: Investment[]; recurringExpenses: Expense[]; categories: Category[] }>(`{
      me { fullName phone addressLine postalCode city country birthDate currency plan readOnly onboardingCompleted }
      accounts { ${ACCOUNT_FIELDS} }
      investments { ${INVESTMENT_FIELDS} }
      recurringExpenses { ${EXPENSE_FIELDS} }
      categories { id name }
    }`),
    step === 3 ? searchInstruments(q) : Promise.resolve({}),
    getTranslations("app.pro"),
  ]);
  const { me } = data;
  if (me.onboardingCompleted) redirect("/dashboard");
  // Later steps need the personal details (the API requires a full name to finish).
  if (step > 1 && !me.fullName) redirect(`${PAGE}?step=1`);

  const key = STEPS[step - 1];
  const hiddenBack = <input type="hidden" name="back" value={back} />;
  const navigation = (
    <div className="flex items-center justify-between gap-4 border-t-[3px] border-ink pt-6">
      {step > 1 ? <Link href={`${PAGE}?step=${step - 1}`} className="text-[15px] underline">{t("back")}</Link> : <span />}
      {step < STEPS.length ? (
        <Link href={nextStep} className="btn inline-flex h-14 items-center bg-brand px-8 text-base font-semibold text-cream hover:no-underline">
          {t("continue")}
        </Link>
      ) : (
        <form action={completeOnboarding}>
          {hiddenBack}
          <button className={`${primaryButton} w-auto`}>{t("finish")}</button>
        </form>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="flex items-center justify-between bg-brand px-5 py-5 text-cream lg:px-20">
        <Logo />
        <form action={logout}>
          <button className="cursor-pointer border-0 bg-transparent p-0 font-sans text-sm text-mist underline">{t("logout")}</button>
        </form>
      </header>

      <main className="mx-auto flex w-full max-w-[880px] flex-col gap-10 px-5 py-10 lg:py-16">
        <ol className="m-0 grid list-none grid-cols-4 gap-2 p-0" aria-label={t("progress", { step, total: STEPS.length })}>
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i + 1 === step ? "step" : undefined} className={`flex flex-col gap-2 border-t-[3px] pt-2 ${i + 1 <= step ? "border-leaf" : "border-rule"}`}>
              <span className="font-mono text-xs text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
              <span className="hidden text-sm font-semibold sm:block">{t(`steps.${s}.short`)}</span>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-3">
          <div className={`${eyebrow} text-ink-muted`}>{t("stepOf", { step, total: STEPS.length })}</div>
          <h1 className="m-0 text-4xl font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-5xl">{t(`steps.${key}.title`)}</h1>
          <p className="m-0 max-w-[640px] text-base text-ink-muted">{t(`steps.${key}.intro`)}</p>
        </div>
        <PageNotice {...notice} />

        {key === "personal" && (
          <form action={updateProfile} className="flex flex-col gap-6">
            {hiddenBack}
            <input type="hidden" name="next" value={nextStep} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={`${labelClass} sm:col-span-2`}>
                {t("fields.fullName")}
                <input name="fullName" required maxLength={100} autoComplete="name" defaultValue={me.fullName ?? ""} className={inputClass} />
              </label>
              <label className={labelClass}>
                {t("fields.phone")}
                <input name="phone" type="tel" maxLength={30} autoComplete="tel" defaultValue={me.phone ?? ""} className={inputClass} />
              </label>
              <label className={labelClass}>
                {t("fields.birthDate")}
                <input name="birthDate" type="date" defaultValue={me.birthDate ?? ""} className={`${inputClass} font-mono`} />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                {t("fields.addressLine")}
                <input name="addressLine" maxLength={200} autoComplete="street-address" defaultValue={me.addressLine ?? ""} className={inputClass} />
              </label>
              <label className={labelClass}>
                {t("fields.postalCode")}
                <input name="postalCode" maxLength={12} autoComplete="postal-code" defaultValue={me.postalCode ?? ""} className={inputClass} />
              </label>
              <label className={labelClass}>
                {t("fields.city")}
                <input name="city" maxLength={100} autoComplete="address-level2" defaultValue={me.city ?? ""} className={inputClass} />
              </label>
              <label className={labelClass}>
                {t("fields.country")}
                <input name="country" maxLength={2} pattern="[A-Za-z]{2}" placeholder="ES" defaultValue={me.country ?? ""} className={`${inputClass} font-mono uppercase`} />
              </label>
              <label className={labelClass}>
                {t("fields.currency")}
                <input name="currency" required maxLength={3} pattern="[A-Za-z]{3}" defaultValue={me.currency} className={`${inputClass} font-mono uppercase`} />
              </label>
            </div>
            <p className="m-0 text-[13px] text-ink-muted">{t("fields.why")}</p>
            <div className="flex justify-end border-t-[3px] border-ink pt-6">
              <button disabled={me.readOnly} className={`${primaryButton} w-auto`}>{t("continue")}</button>
            </div>
          </form>
        )}

        {key === "accounts" && (
          <>
            <Section title={t("steps.accounts.yours")}>
              <AccountList accounts={data.accounts} back={back} readOnly={me.readOnly} />
              {!me.readOnly && <div className="border border-ink p-5"><AccountForm back={back} currency={me.currency} /></div>}
            </Section>
            <Section title={t("plan.title")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(["FREE", "PRO"] as const).map((plan) => (
                  <form key={plan} action={setPlan} className={`flex flex-col gap-3 border p-5 ${me.plan === plan ? "border-[3px] border-leaf" : "border-ink"}`}>
                    {hiddenBack}
                    <input type="hidden" name="plan" value={plan} />
                    <div className="text-2xl font-extrabold tracking-[-0.03em]">{t(`plan.${plan}.name`)}</div>
                    <p className="m-0 grow text-[15px] text-ink-muted">{t(`plan.${plan}.text`)}</p>
                    {me.plan === plan ? (
                      <span className="font-mono text-xs text-leaf">{t("plan.selected")}</span>
                    ) : (
                      <button disabled={me.readOnly} className={`${smallButton} self-start`}>{t("plan.choose")}</button>
                    )}
                  </form>
                ))}
              </div>
              <p className="m-0 text-[13px] text-ink-muted">{t("plan.noPayments")}</p>
            </Section>
          </>
        )}

        {key === "investments" && (
          <Section title={t("steps.investments.yours")}>
            <InvestmentList investments={data.investments} back={back} readOnly={me.readOnly} />
            {me.plan === "PRO" ? (
              <InvestmentSearch action={PAGE} hidden={{ step: "3" }} query={q} {...search} back={q ? `${back}&q=${encodeURIComponent(q)}` : back} readOnly={me.readOnly} />
            ) : (
              <ProUpsell title={pro("investments.title")} text={pro("investments.onboarding")} cta={pro("ctaOnboarding")} href={`${PAGE}?step=2`} />
            )}
          </Section>
        )}

        {key === "expenses" && (
          <Section title={t("steps.expenses.yours")}>
            <ExpenseList expenses={data.recurringExpenses} back={back} readOnly={me.readOnly} categories={data.categories} accounts={data.accounts} />
            {!me.readOnly && <div className="border border-ink p-5"><ExpenseForm back={back} accounts={data.accounts} categories={data.categories} /></div>}
          </Section>
        )}

        {key !== "personal" && navigation}
      </main>
    </div>
  );
}
