import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        navy: {
          DEFAULT: "#0B2447",
          deep: "#000F27",
          light: "#1A3A6B",
          50: "#F0F4FA",
          100: "#D5DEEC",
          200: "#A9BCD9",
          300: "#7E9BC6",
          400: "#5279B3",
          500: "#3D5F95",
          600: "#2E4773",
          700: "#1F3050",
          800: "#11192E",
          900: "#0B2447",
        },
        gold: {
          DEFAULT: "#CCA823",
          light: "#E9C33F",
          bright: "#FFE083",
          subtle: "#FEF6DA",
          50: "#FFFAEB",
          100: "#FFEFC2",
          200: "#FFE083",
          300: "#E9C33F",
          400: "#D6B028",
          500: "#CCA823",
          600: "#A0841A",
          700: "#735C00",
          800: "#574500",
          900: "#231B00",
        },
        surface: {
          DEFAULT: "#F8F9FF",
          low: "#EFF4FF",
          mid: "#E5EEFF",
          high: "#DCE9FF",
          card: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#0B1C30",
          muted: "#44474E",
          subtle: "#74777F",
          faint: "#9CA0A8",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "label-caps": ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
        "body-sm": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-lg": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        h3: ["20px", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "600" }],
        h2: ["24px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        h1: ["32px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        "h1-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
      },
      spacing: {
        topbar: "64px",
        sidebar: "240px",
        "sidebar-collapsed": "72px",
      },
      maxWidth: {
        container: "1440px",
      },
      boxShadow: {
        "card-hover": "0 8px 24px -8px rgba(11, 36, 71, 0.12)",
        "card-elevated": "0 4px 16px -4px rgba(11, 36, 71, 0.08)",
        "navy-glow": "0 4px 12px -2px rgba(11, 36, 71, 0.25)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.95)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-dot": "pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fade-in-up 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
