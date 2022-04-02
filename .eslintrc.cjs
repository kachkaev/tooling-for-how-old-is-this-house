module.exports = {
  extends: [
    "@kachkaev/eslint-config-react",
    "@kachkaev/eslint-config-react/extra-type-checking",
    "plugin:@next/next/recommended",
  ],
  overrides: [
    {
      files: ["src/commands/**"],
      rules: {
        "unicorn/filename-case": "off",
      },
    },
  ],
};
