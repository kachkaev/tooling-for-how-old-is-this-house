module.exports = {
  extends: ["@kachkaev/eslint-config-react"],
  rules: {
    "import/no-default-export": "error",
    "@typescript-eslint/naming-convention": [
      "error",
      // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/naming-convention.md
      {
        selector: "class",
        format: ["StrictPascalCase"],
      },
      {
        selector: "typeLike",
        format: ["PascalCase"],
      },
      {
        selector: ["variableLike"],
        format: ["strictCamelCase", "StrictPascalCase"],
        filter: {
          regex: "^(_|.*[XYZ][A-Z].*)$",
          match: false,
        },
      },
      {
        selector: ["memberLike"],
        leadingUnderscore: "allow",
        filter: {
          regex: "^(__ANT_.*|_|.*[XYZ][A-Z].*|__html|.*(--|__).*)$",
          match: false,
        },
        format: ["strictCamelCase", "StrictPascalCase", "UPPER_CASE"],
      },
    ],
  },
  overrides: [
    {
      files: ["src/pages/**", "src/scripts/**"],
      rules: {
        "import/no-default-export": "off",
      },
    },
    {
      files: ["cli/**"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
};
