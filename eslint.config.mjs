import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "src/data/**"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2022,
      sourceType: "module",
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
      import: importPlugin,
    },
    rules: {
      // Group + sort imports: external packages -> @/ alias -> relative.
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^\\u0000"], // side-effect imports
            ["^node:", "^@?\\w"], // node builtins + npm packages
            ["^@/"], // internal cross-package alias
            ["^\\."], // relative (own package)
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      // Merge multiple imports from the same module into one statement.
      "import/no-duplicates": "error",
    },
  },
  // Keep ESLint out of Prettier's way (formatting is owned by Prettier).
  prettier,
);
