import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        Math: "readonly",
        alert: "readonly",
        requestAnimationFrame: "readonly",
        localStorage: "readonly",
        Tone: "readonly", // Prevents ESLint from flagging Tone.js as an undefined variable
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off", // We want to keep the console.log("App Initialised")
      eqeqeq: "error", // Enforces strict === equality
      "no-var": "error", // Forbids legacy var declarations
      "prefer-const": "warn", // Encourages const over let where applicable
    },
  },
];
