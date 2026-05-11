import { AxiosError } from "axios";

type ErrorResponseBody = {
  message?: string;
  error?: string;
  detail?: string;
  status?: number;
  path?: string;
  timestamp?: string;
};

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage = "요청 처리 중 오류가 발생했습니다.",
) => {
  const axiosError = error as AxiosError<ErrorResponseBody | string>;

  const responseData = axiosError.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData.trim();
  }

  if (responseData && typeof responseData === "object") {
    return (
      responseData.message ||
      responseData.error ||
      responseData.detail ||
      fallbackMessage
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};
