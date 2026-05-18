import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          300: "#8b5cf6",
          400: "#7c3aed",
          500: "#6d28d9",
          600: "#5b21b6",
        },
        surface: {
          base:    "#0f0f13",
          raised:  "#18181f",
          overlay: "#222230",
          border:  "#2e2e3e",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
