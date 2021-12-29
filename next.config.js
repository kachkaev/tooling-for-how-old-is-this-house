import fs from "fs-extra";

export default {
  styledComponents: true,
  i18n: {
    defaultLocale: "ru",
    localeDetection: false,
    locales: ["ru", "en"],
  },
  webpack: (defaultConfig) => {
    // https://github.com/vercel/next.js/discussions/32220#discussioncomment-1766378
    if (!fs.existsSync("./.next")) {
      fs.mkdirSync("./.next");
    }

    if (!fs.existsSync("./.next/package.json")) {
      fs.writeJsonSync("./.next/package.json", { type: "commonjs" });
    }

    return defaultConfig;
  },
};
