import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from "./config";

// "en-GB,en;q=0.9,es;q=0.8" → first supported language, by preference.
function fromAcceptLanguage(header: string | null): Locale | undefined {
  return header
    ?.split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.split("-")[0].toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.lang)
    .find(isLocale);
}

// No locale in the URL: the user's choice (cookie) wins, then the browser language, then Spanish.
// ponytail: cookie-based locale makes pages dynamic; add a [locale] segment if SEO per language matters.
export default getRequestConfig(async () => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : (fromAcceptLanguage((await headers()).get("accept-language")) ?? defaultLocale);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
