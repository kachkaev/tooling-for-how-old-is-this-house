module.exports = {
  i18n: {
    locales: ["ru"],
    defaultLocale: "ru",
  },

  redirects: () => [
    {
      source: "/",
      destination: "/poster",
      permanent: false,
    },
  ],
};
