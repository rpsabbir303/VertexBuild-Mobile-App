/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#1C2A3A",
          blue: "#4BA3D9",
          sky: "#7EC8EA",
          softblue: "#E8F5FC",
          orange: "#FF6A00",
          soft: "#F3F7FB",
          muted: "#7A8A9A",
          line: "#E6EEF5",
          black: "#0F1720",
          ink: "#101820",
          surface: "#FFFFFF",
          canvas: "#EEF3F8",
          mist: "#94A3B3",
        },
        status: {
          success: "#22A06B",
          warning: "#C9851A",
          danger: "#E35D4A",
          info: "#4BA3D9",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "DM Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        mobile: "16px",
        "mobile-lg": "22px",
        pill: "999px",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(28, 42, 58, 0.06)",
        card: "0 8px 24px rgba(28, 42, 58, 0.07)",
        float: "0 12px 40px rgba(28, 42, 58, 0.12)",
        glow: "0 8px 24px rgba(75, 163, 217, 0.35)",
        sheet: "0 -8px 32px rgba(28, 42, 58, 0.12)",
      },
      spacing: {
        "nav-safe": "calc(84px + env(safe-area-inset-bottom, 0px))",
      },
      backgroundImage: {
        "soft-sky":
          "radial-gradient(ellipse 80% 50% at 10% 0%, rgba(126, 200, 234, 0.28), transparent 55%), radial-gradient(ellipse 70% 45% at 100% 10%, rgba(180, 210, 230, 0.35), transparent 50%), linear-gradient(180deg, #F5F9FC 0%, #EEF3F8 100%)",
        "card-sky":
          "linear-gradient(145deg, rgba(232, 245, 252, 0.95) 0%, rgba(255, 255, 255, 0.92) 55%, rgba(255, 255, 255, 0.98) 100%)",
      },
    },
  },
  plugins: [],
};
