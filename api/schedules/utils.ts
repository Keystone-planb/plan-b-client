export const isHtmlResponse = (
  data: unknown,
) => {
  if (typeof data !== "string") {
    return false;
  }

  const trimmed =
    data.trim().toLowerCase();

  return (
    trimmed.startsWith("<!doctype html>") ||
    trimmed.startsWith("<html")
  );
};

export const assertNotHtmlResponse = (
  data: unknown,
  apiName: string,
) => {
  if (!isHtmlResponse(data)) {
    return;
  }

  throw new Error(
    `${apiName} API가 HTML을 반환했습니다. BASE_URL과 백엔드 서버 상태를 확인해주세요.`,
  );
};
