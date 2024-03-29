import * as envalid from "envalid";

import { cleanEnv } from "../clean-env";

export type Locale = "en" | "ru";

export const getLocaleFromEnv = (): Locale => {
  const env = cleanEnv({
    LOCALE: envalid.str({
      choices: ["ru", "en"] as const,
      default: "ru",
    }),
  });

  return env.LOCALE;
};
