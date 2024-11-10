import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        perfect: "var(--perfect)",
        excellent: "var(--excellent)",
        great: "var(--great)",
        good: "var(--good)",
        average: "var(--average)",
        bad: "var(--bad)",
        miss: "var(--miss)",
        
        perfect_hover: "var(--perfect-hover)",
        excellent_hover: "var(--excellent-hover)",
        great_hover: "var(--great-hover)",
        good_hover: "var(--good-hover)",
        average_hover: "var(--average-hover)",
        bad_hover: "var(--bad-hover)",
        miss_hover: "var(--miss-hover)",
      },
      boxShadow: {
        'vertical-card': '0 6px 12px rgba(0, 0, 0, 1)',
        'box-card': '0 2px 8px rgba(0, 0, 0, 1)',
      }
    },
  },
  plugins: [],
};
export default config;
