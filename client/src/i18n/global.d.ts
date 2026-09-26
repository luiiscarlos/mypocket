import type messages from "../../messages/es.json";
import type { Locale } from "./config";

// Type-safe keys: a key missing from es.json is a compile error. en.json must mirror es.json.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
