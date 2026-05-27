import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        line: "#d8dee6",
        paper: "#fbfaf7",
        mint: "#2f8f83",
        coral: "#d96c5f"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(23, 32, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
