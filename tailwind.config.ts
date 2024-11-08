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
      },
    },
  },
  plugins: [],
};
export default config;
