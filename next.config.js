/**
 * @type import("next").NextConfig
 */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },

  pageExtensions: ["page.tsx", "handler.ts"],

  i18n: {
    defaultLocale: "ru",
    localeDetection: false,
    locales: ["ru", "en"],
  },
};

export default nextConfig;
