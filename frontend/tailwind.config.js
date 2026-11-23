/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── mWellness Bazaar herbal palette (matches reference site tokens) ── */
        herb: {
          background: "oklch(97.5% 0.012 85)",       // warm cream page background
          card: "oklch(99.5% 0.005 85)",             // near-white warm card
          foreground: "oklch(20% 0.02 60)",          // dark warm-brown text
          ink: "oklch(16% 0.004 60)",                // near-black ink
          "ink-foreground": "oklch(98% 0.01 85)",
          primary: "oklch(17% 0.005 60)",            // dark buttons
          "primary-foreground": "oklch(98% 0.01 85)",
          secondary: "oklch(93% 0.025 80)",          // soft beige surface
          "secondary-foreground": "oklch(25% 0.03 60)",
          muted: "oklch(94% 0.018 82)",
          "muted-foreground": "oklch(48% 0.025 60)",
          accent: "oklch(90% 0.04 75)",              // light warm gold tint
          "accent-foreground": "oklch(25% 0.03 60)",
          wood: "oklch(60% 0.085 62)",               // warm mid wood brown
          "wood-dark": "oklch(44% 0.065 58)",        // deep wood brown
          "wood-light": "oklch(80% 0.07 72)",        // pale wood
          rustic: "oklch(34% 0.035 68)",             // rustic dark brown
          leaf: "oklch(50% 0.09 150)",               // herbal green accent
          footer: "oklch(24% 0.027 155)",            // deep forest-green footer
          "footer-foreground": "oklch(95% 0.01 85)",
          "footer-accent": "oklch(79% 0.07 85)",     // warm sand-gold on footer
          border: "oklch(89% 0.02 78)",
          input: "oklch(89% 0.02 78)",
          ring: "oklch(62% 0.09 65)",
          destructive: "oklch(57.7% 0.245 27.325)",
        },
        "rabbit-red": "#ea2e0e",
        navratri: {
          burgundy: "#4A0712",
          darkBurgundy: "#650B18",
          wine: "#3A0610",
          maroon: "#7A1522",
          gold: "#D4A017",
          brightGold: "#F2C94C",
          orange: "#F59E0B",
          cream: "#FFF8E7",
          ivory: "#FFFDF5",
          mutedGold: "#B88916",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "0.75rem",
      },
      boxShadow: {
        soft: "0 12px 30px -16px oklch(30% 0.04 60 / 0.35)",
      },
    },
  },
  plugins: [],
}
