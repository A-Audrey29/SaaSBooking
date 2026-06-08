import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "var(--card)",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        brand: {
          DEFAULT: "var(--brand)",
          soft: "var(--brand-soft)",
          ink: "var(--brand-ink)",
        },
        "s-confirmed": {
          bg: "var(--s-confirmed-bg)",
          border: "var(--s-confirmed-border)",
          ink: "var(--s-confirmed-ink)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        /* Design system tokens */
        paper: "var(--paper)",
        sidebar: "var(--sidebar)",
        ink: {
          50: "var(--ink-50)",
          150: "var(--ink-150)",
          200: "var(--ink-200)",
          300: "var(--ink-300)",
          400: "var(--ink-400)",
          500: "var(--ink-500)",
          700: "var(--ink-700)",
          900: "var(--ink-900)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        "t-xs": ["11px", { lineHeight: "1.4" }],
        "t-sm": ["13px", { lineHeight: "1.4" }],
        "h-sm": ["14px", { lineHeight: "1.3" }],
        "h-md": ["15px", { lineHeight: "1.3" }],
        "h-lg": ["18px", { lineHeight: "1.25" }],
        "h-xl": ["22px", { lineHeight: "1.2" }],
        "h-2xl": ["24px", { lineHeight: "1.2" }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
