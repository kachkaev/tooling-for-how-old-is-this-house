import path from "node:path";

const buildEslintCommand = (filePaths) =>
  `next lint --fix --file ${filePaths
    .map((filePath) => path.relative(process.cwd(), filePath))
    .join(" --file ")}`;

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "**/*": [buildEslintCommand, "markdownlint --fix", "prettier --write"],
};
