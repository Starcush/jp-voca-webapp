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
          kanji: "#2563EB",
          meaning: "#16A34A",
          example: "#DC2626",
        },
      },
    },
  },
  plugins: [forms],
};

export default config;

