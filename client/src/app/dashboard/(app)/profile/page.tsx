import { getTranslations } from "next-intl/server";
import { updateProfile } from "@/app/dashboard/actions";
import { PageHeader, PageNotice, Section, primaryBtn } from "@/components/app/ui";
import { inputClass, labelClass } from "@/components/forms";
import { gql } from "@/lib/api";
import { appNotice } from "@/lib/auth-codes";

type Me = {
  email: string | null; displayName: string | null; fullName: string | null; phone: string | null; addressLine: string | null;
  postalCode: string | null; city: string | null; country: string | null; birthDate: string | null; currency: string; readOnly: boolean;
};
type Field = Exclude<keyof Me, "email" | "readOnly">;

const PAGE = "/dashboard/profile";

export async function generateMetadata() {
  return { title: (await getTranslations("app.header"))("profile") };
}

export default async function ProfilePage({ searchParams }: PageProps<"/dashboard/profile">) {
  const [t, header, notice, { me }] = await Promise.all([
    getTranslations("app.settings.profile"),
    getTranslations("app.header"),
    appNotice(await searchParams),
    gql<{ me: Me }>("{ me { email displayName fullName phone addressLine postalCode city country birthDate currency readOnly } }"),
  ]);
  const field = (name: Field, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className={labelClass}>
      {t(name)}
      <input name={name} defaultValue={me[name] ?? ""} disabled={me.readOnly} className={inputClass} {...props} />
    </label>
  );

  return (
    <>
      <PageHeader title={header("profile")} meta={me.email ?? undefined} />
      <PageNotice {...notice} />
      <form action={updateProfile} className="flex flex-col gap-10">
        <input type="hidden" name="back" value={PAGE} />
        <Section title={t("personal")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {field("fullName", { maxLength: 100, autoComplete: "name" })}
            {field("displayName", { maxLength: 50 })}
            {field("birthDate", { type: "date", className: `${inputClass} font-mono` })}
            {field("phone", { type: "tel", maxLength: 30, autoComplete: "tel" })}
          </div>
        </Section>
        <Section title={t("address")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {field("addressLine", { maxLength: 200, autoComplete: "street-address" })}
            {field("postalCode", { maxLength: 12, autoComplete: "postal-code" })}
            {field("city", { maxLength: 100, autoComplete: "address-level2" })}
            {field("country", { maxLength: 2, pattern: "[A-Za-z]{2}", placeholder: "ES", className: `${inputClass} font-mono uppercase` })}
          </div>
        </Section>
        <Section title={t("money")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {field("currency", { maxLength: 3, pattern: "[A-Za-z]{3}", required: true, className: `${inputClass} font-mono uppercase` })}
          </div>
        </Section>
        {!me.readOnly && <button className={`${primaryBtn} self-start`}>{t("save")}</button>}
      </form>
    </>
  );
}
