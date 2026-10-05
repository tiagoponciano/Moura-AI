import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Module boundaries: see the "Folder layout" section of the root README.
const featureBoundaries = [
  {
    // Routes reach a feature only through its public entry points.
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/*", "!@/features/*/server"],
              message:
                "Import features from their public entry (@/features/<name> or @/features/<name>/server).",
            },
          ],
        },
      ],
    },
  },
  {
    // Shared code never depends on a feature.
    files: [
      "components/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
      "hooks/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features", "@/features/**"],
              message:
                "Shared code must not import features. Move the code up to components/ or lib/ instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // Inside a feature, own files use relative imports and other features are off-limits.
    files: ["features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features", "@/features/**"],
              message:
                "Use relative imports inside a feature; never import another feature. Shared code belongs in components/ or lib/.",
            },
          ],
        },
      ],
    },
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...featureBoundaries,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
