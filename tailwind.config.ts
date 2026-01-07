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
        // 커스텀 색상을 추가할 수 있습니다
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
    },
  },
  plugins: [],
};

export default config;
