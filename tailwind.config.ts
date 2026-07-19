import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        word: {
          kanji: "#0F172A",
          meaning: "#16A34A",
          example: "#DC2626",
        },
        primary: {
          DEFAULT: "oklch(0.5 0.13 275)",
          tint: "oklch(0.9 0.04 275)",
          text: "oklch(0.4 0.11 275)",
          border: "oklch(0.85 0.06 275)",
        },
        status: {
          positive: "oklch(0.42 0.11 145)",
          "positive-bg": "oklch(0.9 0.04 145)",
          "positive-border": "oklch(0.85 0.06 145)",
          negative: "oklch(0.42 0.11 25)",
          "negative-bg": "oklch(0.9 0.04 25)",
          "negative-border": "oklch(0.85 0.06 25)",
          warning: "oklch(0.42 0.11 85)",
          "warning-bg": "oklch(0.9 0.04 85)",
        },
      },
    },
  },
  plugins: [forms],
};

export default config;
