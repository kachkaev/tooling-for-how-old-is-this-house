/**
 * @type import("next").NextConfig
 */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },

  i18n: {
    defaultLocale: "ru",
    localeDetection: false,
    locales: ["ru", "en"],
  },
};

export default nextConfig;
