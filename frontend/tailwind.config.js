/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0B1120",
          card: "#111827",
          elevated: "#1a2234",
        },
        accent: {
          purple: "#7C3AED",
          indigo: "#6366F1",
          cyan: "#06B6D4",
        },
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
        },
        border: {
          subtle: "rgba(255,255,255,0.08)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
        btn: "16px",
      },
      boxShadow: {
        glow: "0 0 60px rgba(124, 58, 237, 0.25)",
        "glow-sm": "0 0 30px rgba(99, 102, 241, 0.2)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.06)",
        "card-hover": "0 8px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(124, 58, 237, 0.3)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-accent": "linear-gradient(135deg, #7C3AED 0%, #6366F1 50%, #06B6D4 100%)",
        "gradient-accent-hover": "linear-gradient(135deg, #8B5CF6 0%, #818CF8 50%, #22D3EE 100%)",
      },
    },
  },
  plugins: [],
}
