import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 커스텀 색상을 추가할 수 있습니다
      },
      fontFamily: {
        "title-light": ["Title_Light", "sans-serif"],
        "title-medium": ["Title_Medium", "sans-serif"],
        "title-bold": ["Title_Bold", "sans-serif"],
        landing: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Roboto", "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
