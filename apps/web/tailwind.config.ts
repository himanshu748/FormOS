import type { Config } from "tailwindcss";

/**
 * Tailwind handles responsive layout (grids, spacing, breakpoints) only.
 * The retro visual skin lives in @formos/ui/styles.css.
 */
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        retro: ["Tahoma", "Segoe UI", "Verdana", "sans-serif"],
        display: ['"Press Start 2P"', "Tahoma", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
