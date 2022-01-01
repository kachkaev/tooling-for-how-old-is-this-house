// eslint-disable-next-line no-undef
module.exports = {
  extends: ["@kachkaev/eslint-config-react", "plugin:@next/next/recommended"],
  rules: {
    "import/no-unresolved": "off", // https://github.com/import-js/eslint-plugin-import/issues/2132
  },
};
