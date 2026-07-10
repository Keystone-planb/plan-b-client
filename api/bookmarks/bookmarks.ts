import axios from "axios";

import apiClient from "../client";

export type BookmarkResponse = {
  bookmarkId: number;
  googlePlaceId: string;
  name?: string | null;
  category?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  createdAt?: string;
};

export type CreateBookmarkRequest = {
  googlePlaceId: string;
  name: string;
  category?: string;
  address?: string;
  lat?: number;
  lng?: number;
};

export class BookmarkApiError extends Error {
  status: number;

  constructor(
    status: number,
    message: string,
  ) {
    super(message);

    this.name = "BookmarkApiError";
    this.status = status;
  }
}

const getBookmarkErrorMessage = (
  data: unknown,
  fallbackMessage: string,
): string => {
  if (
    data &&
    typeof data === "object"
  ) {
    const responseData = data as {
      message?: unknown;
      error?: unknown;
    };

    if (
      typeof responseData.message === "string" &&
      responseData.message.trim().length > 0
    ) {
      return responseData.message;
    }

    if (
      typeof responseData.error === "string" &&
      responseData.error.trim().length > 0
    ) {
      return responseData.error;
    }
  }

  if (
    typeof data === "string" &&
    data.trim().length > 0
  ) {
    return data;
  }

  return fallbackMessage;
};

const toBookmarkApiError = (
  error: unknown,
): BookmarkApiError => {
  if (error instanceof BookmarkApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;

    const message = getBookmarkErrorMessage(
      error.response?.data,
      error.message ||
        (status > 0
          ? `HTTP ${status}`
          : "북마크 요청에 실패했습니다."),
    );

    return new BookmarkApiError(
      status,
      message,
    );
  }

  return new BookmarkApiError(
    0,
    error instanceof Error
      ? error.message
      : "북마크 요청에 실패했습니다.",
  );
};

export const createBookmark = async (
  payload: CreateBookmarkRequest,
): Promise<BookmarkResponse> => {
  try {
    const response =
      await apiClient.post<BookmarkResponse>(
        "/api/bookmarks",
        payload,
      );

    return response.data;
  } catch (error) {
    throw toBookmarkApiError(error);
  }
};

export const getBookmarks = async (): Promise<
  BookmarkResponse[]
> => {
  try {
    const response =
      await apiClient.get<BookmarkResponse[]>(
        "/api/bookmarks",
      );

    return Array.isArray(response.data)
      ? response.data
      : [];
  } catch (error) {
    throw toBookmarkApiError(error);
  }
};

export const deleteBookmark = async (
  bookmarkId: number,
): Promise<void> => {
  try {
    await apiClient.delete(
      `/api/bookmarks/${bookmarkId}`,
    );
  } catch (error) {
    throw toBookmarkApiError(error);
  }
};
