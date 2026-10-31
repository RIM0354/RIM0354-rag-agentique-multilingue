import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#eef6ff", 100: "#d9eaff", 400: "#5b9dff", 500: "#3b7bf6", 600: "#2a5fe0", 900: "#0f2350" },
        gold: { 400: "#f3c45a", 500: "#e3a92b" },
      },
      fontFamily: { sans: ["Inter", "Segoe UI", "system-ui", "-apple-system", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
