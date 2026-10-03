import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Brand font (Kanit) injected by next/font as --font-kanit.
        sans: ["var(--font-kanit)", ...defaultTheme.fontFamily.sans],
        serif: ["Georgia", "Cambria", "Times New Roman", ...defaultTheme.fontFamily.serif],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        forest: {
          DEFAULT: "#1B3B2B",
          50: "#F2F7F4",
          100: "#E2EDE6",
          200: "#C4DBD0",
          500: "#27543E",
          800: "#1B3B2B",
          900: "#12291E",
        },
        gold: {
          DEFAULT: "#C5A059",
          50: "#FAF6ED",
          100: "#F3EBD6",
          200: "#E7D6AC",
          500: "#C5A059",
          600: "#A8833D",
        },
        cream: {
          DEFAULT: "#FAF8F5",
          50: "#FFFFFF",
          100: "#FAF8F5",
          200: "#F4EFE6",
          300: "#EAE3D5",
        },
        earth: {
          DEFAULT: "#26221F",
          500: "#6E6862",
          800: "#38332F",
          900: "#26221F",
        },
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      maxWidth: {
        shell: "28rem",
      },
    },
  },
  plugins: [],
};

export default config;
