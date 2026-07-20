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
          kanji: "#191919",
          meaning: "#5B5B5B",
          example: "#777777",
        },
        brand: {
          background: "#F2F2F2",
          surface: "#FFFFFF",
          border: "#E5E5E5",
          "border-strong": "#C4C4C4",
          text: "#191919",
          muted: "#777777",
          "muted-soft": "#C4C4C4",
          purple: "#191919",
          "purple-dark": "#000000",
          green: "#FC4B1F",
          "green-dark": "#D83E18",
          flag: "#FF6B3A",
          "flag-bg": "#FFF3EE",
        },
        primary: {
          DEFAULT: "#FC4B1F",
          tint: "#FFF0EA",
          text: "#D83E18",
          border: "#FFD0C2",
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
