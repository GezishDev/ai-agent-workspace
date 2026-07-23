import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        paper: "#F8FAFC",
        accent: "#0F766E",
        signal: "#BE123C"
      }
    }
  },
  plugins: []
} satisfies Config;

