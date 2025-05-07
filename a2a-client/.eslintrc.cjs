module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  plugins: [
    "unused-imports",
    "@typescript-eslint",
    "react",
    "prettier",
    "import",
  ],

  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  ],
  overrides: [
    {
      env: {
        browser: true,
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
  },
  rules: {
    "no-undef": "error",
    "react/react-in-jsx-scope": "off",
    "react/jsx-key": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    // "@typescript-eslint/no-unnecessary-condition": "error",
    "@typescript-eslint/no-unused-vars": "off",
    "unused-imports/no-unused-imports": "warn",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
      },
    ],
    "sort-imports": [
      "warn",
      {
        ignoreDeclarationSort: true,
      },
    ],
    "import/no-unresolved": "error",
  },
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    "import/resolver": {
      typescript: {
        typescript: true,
        node: true,
        alwaysTryTypes: true,
        project: "tsconfig.json",
      },
    },
  },
};
