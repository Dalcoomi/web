import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontSize: {
      header: [
        "26px",
        { lineHeight: "140%", letterSpacing: "0%", fontWeight: 600 },
      ],
      title1: [
        "24px",
        { lineHeight: "140%", letterSpacing: "0%", fontWeight: 600 },
      ],
      title2: [
        "20px",
        { lineHeight: "140%", letterSpacing: "0%", fontWeight: 600 },
      ],
      subtitle: [
        "17px",
        { lineHeight: "140%", letterSpacing: "0%", fontWeight: 600 },
      ],
      "body1-semibold": [
        "15px",
        { lineHeight: "145%", letterSpacing: "-1%", fontWeight: 600 },
      ],
      "body1-regular": [
        "15px",
        { lineHeight: "145%", letterSpacing: "-1%", fontWeight: 400 },
      ],
      "body2-semibold": [
        "14px",
        { lineHeight: "150%", letterSpacing: "-1%", fontWeight: 600 },
      ],
      "body2-regular": [
        "14px",
        { lineHeight: "150%", letterSpacing: "-1%", fontWeight: 400 },
      ],
      "caption1-semibold": [
        "13px",
        { lineHeight: "150%", letterSpacing: "-1%", fontWeight: 600 },
      ],
      "caption1-medium": [
        "13px",
        { lineHeight: "150%", letterSpacing: "-1%", fontWeight: 500 },
      ],
      "caption2-semibold": [
        "12px",
        { lineHeight: "150%", letterSpacing: "-1%", fontWeight: 600 },
      ],
      "caption2-medium": [
        "12px",
        { lineHeight: "150%", letterSpacing: "-1%", fontWeight: 500 },
      ],
    },
    extend: {
      colors: {
        gray: {
          30: "#F8F9FA",
          50: "#F4F5F6",
          100: "#E5E6E8",
          150: "#D5D7DA",
          200: "#C6C9CC",
          300: "#B6BABE",
          400: "#979CA1",
          500: "#787F85",
          600: "#596169",
          700: "#474E54",
          800: "#353A3F",
          850: "#24272A",
          900: "#121315",
        },
        brand: {
          gray: "#787F85",
          blue: "#4D83FF",
          red: "#FF4B6C",
          green: "#30D675",
          yellow: "#FFC94B",
        },
        red: {
          50: "#FFEDF0",
          100: "#FFDBE2",
          150: "#FFC9D3",
          200: "#FFB7C4",
          300: "#FF93A7",
          400: "#FF6F89",
          500: "#FF4B6C",
          600: "#D33C58",
          700: "#A72D43",
          800: "#7A1E2F",
          850: "#4E0F1A",
          900: "#380810",
        },
        blue: {
          50: "#EDF3FF",
          100: "#DBE6FF",
          150: "#CADAFF",
          200: "#B8CDFF",
          300: "#94B5FF",
          400: "#719CFF",
          500: "#4D83FF",
          600: "#3E6BD3",
          700: "#2E53A7",
          800: "#1F3B7C",
          850: "#172F66",
          900: "#0F2350",
        },
        green: {
          50: "#EAFBF1",
          100: "#D6F7E3",
          150: "#C1F3D6",
          200: "#ACEFC8",
          300: "#83E6AC",
          400: "#59DE91",
          500: "#30D675",
          600: "#26AB5E",
          700: "#1D8046",
          800: "#13562F",
          850: "#0E4023",
          900: "#0A2B17",
        },
      },
      fontFamily: {
        "title-light": ["Title_Light", "sans-serif"],
        "title-medium": ["Title_Medium", "sans-serif"],
        "title-bold": ["Title_Bold", "sans-serif"],
        landing: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        "cursor-blink": "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};

export default config;
