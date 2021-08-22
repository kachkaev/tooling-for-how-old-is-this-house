import * as envalid from "envalid";

import { cleanEnv } from "../cleanEnv";

export type Locale = "en" | "ru";

export const getLocaleFromEnv = (): Locale => {
  const env = cleanEnv({
    LOCALE: envalid.str({
      default: "ru",
      choices: ["ru", "en"],
    }),
  });

  return env.LOCALE as Locale;
};
