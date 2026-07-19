# Dalcoomi Web

개인·그룹 가계부와 AI 영수증 분석을 제공하는 달쿠미의 웹/PWA 프론트엔드입니다.

## 기술 스택

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, Zustand 5
- `@ducanh2912/next-pwa`
- `@dnd-kit` 기반 그룹 순서 편집

## 실행

```bash
npm install
npm run dev
```

환경 변수는 `APP_ENV`에 따라 `env-config/.env.local`, `.env.dev`, `.env.prod`에서 로드합니다.

## 품질 검사

```bash
npm run lint
npm run typecheck
npm run build
npm audit
```

## 주요 구조

- `src/app`: 페이지 및 OAuth Route Handler
- `src/components`: 도메인·공통 UI
- `src/services`: 백엔드 API와 체험 데이터 어댑터
- `src/stores`: 회원·토스트 전역 상태
- `src/utils`: API 클라이언트, 토큰, 체험 모드, 날짜·검증 유틸
- `ai-context`: 에이전트와 개발자를 위한 프로젝트/API 문서

## 인증과 체험 모드

- 실제 로그인은 access/refresh token 쿠키를 사용하며 401 응답 시 access token을 한 번만 재발급합니다.
- 체험 모드는 로그인 화면에서 사용자가 명시적으로 시작해야 활성화됩니다.
- 체험 여부는 현재 브라우저 탭의 `sessionStorage`에 저장되고, 데이터 변경은 메모리에만 반영됩니다.
- 로그인 성공 또는 체험 모드 종료 시 체험 상태가 제거됩니다.
