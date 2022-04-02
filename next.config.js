/**
 * @type import("next").NextConfig
 */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },

  eslint: {
    dirs: ["pages", "scripts", "shared"],
  },

  i18n: {
    defaultLocale: "ru",
    localeDetection: false,
    locales: ["ru", "en"],
  },

  pageExtensions: ["page.tsx", "handler.ts"],
};

export default nextConfig;
