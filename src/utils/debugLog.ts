/**
 * 개발 중 터미널 로그를 보기 좋게 정리하는 유틸
 *
 * 운영 빌드에서는 출력되지 않도록 __DEV__에서만 동작한다.
 */

type LogValue = string | number | boolean | null | undefined | object;

const isDev = typeof __DEV__ !== "undefined" && __DEV__;

export const debugLog = (title: string, value?: LogValue) => {
  if (!isDev) return;

  console.log(`\n🧭 ${title}`);

  if (value !== undefined) {
    console.log(value);
  }

  console.log("──────────────────────────────");
};

export const debugSuccess = (title: string, value?: LogValue) => {
  if (!isDev) return;

  console.log(`\n✅ ${title}`);

  if (value !== undefined) {
    console.log(value);
  }

  console.log("──────────────────────────────");
};

export const debugError = (title: string, error?: unknown) => {
  if (!isDev) return;

  console.log(`\n❌ ${title}`);

  if (error instanceof Error) {
    console.log(error.message);
  } else if (error !== undefined) {
    console.log(error);
  }

  console.log("──────────────────────────────");
};
