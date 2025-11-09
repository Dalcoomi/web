// types/analytics.d.ts

/**
 * Google Analytics gtag 타입 정의
 */

declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js" | "set",
      targetId: string | Date,
      config?: Gtag.ConfigParams | Gtag.EventParams | Gtag.CustomParams
    ) => void;
    dataLayer?: unknown[];
  }
}

declare namespace Gtag {
  interface ConfigParams {
    page_path?: string;
    page_title?: string;
    page_location?: string;
    send_page_view?: boolean;
    [key: string]: unknown;
  }

  interface EventParams {
    event_category?: string;
    event_label?: string;
    value?: number;
    [key: string]: unknown;
  }

  interface CustomParams {
    [key: string]: unknown;
  }
}

export {};
