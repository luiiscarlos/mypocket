import { getTranslations } from "next-intl/server";
import { createTransaction, updateTransaction } from "@/app/dashboard/actions";
import { RecurringFields, type Category } from "@/components/app/finance";
import { primaryBtn } from "@/components/app/ui";
import { inputClass, labelClass } from "@/components/forms";

export type Tx = {
  id: string; source: string; type: "INCOME" | "EXPENSE"; amount: number; currency: string; occurredOn: string;
  note: string | null; category: { id: string; name: string } | null; accountId: string | null;
};

/**
 * New transaction (with the optional "periodic" schedule) or edit of an existing one (`tx`).
 * The periodic block is revealed by the switch with CSS only (group-has), no client JS.
 */
export async function TransactionForm({
  back, currency, accounts, categories, tx,
}: { back: string; currency: string; accounts: { id: string; name: string }[]; categories: Category[]; tx?: Tx }) {
  const t = await getTranslations("app.transactions");
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={tx ? updateTransaction : createTransaction} className="group/tx flex flex-col gap-5">
      <input type="hidden" name="back" value={back} />
      {tx && <input type="hidden" name="id" value={tx.id} />}
      <fieldset className="m-0 grid max-w-sm grid-cols-2 border border-ink p-0">
        <legend className="sr-only">{t("type")}</legend>
        {(["EXPENSE", "INCOME"] as const).map((type) => (
          <label key={type} className="flex h-12 cursor-pointer items-center justify-center text-[15px] font-semibold has-[:checked]:bg-leaf has-[:checked]:text-on-leaf has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus">
            <input type="radio" name="type" value={type} defaultChecked={(tx?.type ?? "EXPENSE") === type} className="sr-only" />
            {t(type)}
          </label>
        ))}
      </fieldset>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-[1fr_88px] gap-3">
          <label className={labelClass}>
            {t("amount")}
            <input name="amount" inputMode="decimal" required defaultValue={tx?.amount} placeholder="0,00" className={`${inputClass} font-mono`} />
          </label>
          <label className={labelClass}>
            {t("currency")}
            <input name="currency" defaultValue={tx?.currency ?? currency} pattern="[A-Za-z]{3}" maxLength={3} required className={`${inputClass} font-mono uppercase`} />
          </label>
        </div>
        <label className={labelClass}>
          {t("date")}
          <input name="occurredOn" type="date" defaultValue={tx?.occurredOn ?? today} required className={`${inputClass} font-mono`} />
        </label>
        <label className={labelClass}>
          {t("account")}
          <select name="accountId" defaultValue={tx?.accountId ?? ""} className={`${inputClass} px-3`}>
            <option value="">{t("none")}</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          {t("category")}
          <select name="categoryId" defaultValue={tx?.category?.id ?? ""} className={`${inputClass} px-3`}>
            <option value="">{t("none")}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          {t("note")}
          <input name="note" maxLength={200} defaultValue={tx?.note ?? ""} placeholder={t("notePlaceholder")} className={inputClass} />
        </label>
      </div>

      {!tx && (
        <div className="flex flex-col gap-4 border-t border-rule pt-5">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="flex flex-col">
              <span className="text-base font-semibold">{t("periodic")}</span>
              <span className="text-[13px] text-ink-muted">{t("periodicHint")}</span>
            </span>
            <input type="checkbox" name="periodic" role="switch" className="peer sr-only" />
            <span aria-hidden="true" className="relative h-7 w-[52px] shrink-0 border border-ink after:absolute after:left-[3px] after:top-[3px] after:size-5 after:bg-ink after:transition-transform peer-checked:border-leaf peer-checked:bg-leaf peer-checked:after:translate-x-6 peer-checked:after:bg-on-leaf peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-focus" />
          </label>
          <div className="hidden bg-band p-4 group-has-[[name=periodic]:checked]/tx:block">
            <RecurringFields categories={categories} startName="occurredOn" withCategory={false} />
          </div>
        </div>
      )}
      <p className="m-0 text-[13px] text-ink-muted">{t("balanceHint")}</p>
      <button className={`${primaryBtn} h-14 self-start px-8 text-base`}>{tx ? t("update") : t("save")}</button>
    </form>
  );
}
