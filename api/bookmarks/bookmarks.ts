import AsyncStorage from "@react-native-async-storage/async-storage";

const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(
    /\/+$/,
    "",
  );

const API_BASE_URL =
  configuredBaseUrl ||
  (process.env.EXPO_PUBLIC_API_ENV === "prod"
    ? "https://api.planb-travel.cloud"
    : "https://api-dev.planb-travel.cloud");

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

const requestBookmarkApi = async <T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "DELETE";
    body?: unknown;
  } = {},
): Promise<T> => {
  const accessToken =
    await AsyncStorage.getItem(
      "access_token",
    );

  if (!accessToken) {
    throw new BookmarkApiError(
      401,
      "로그인 토큰이 없습니다.",
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      method: options.method ?? "GET",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
        "Content-Type":
          "application/json",
      },
      body:
        options.body === undefined
          ? undefined
          : JSON.stringify(
              options.body,
            ),
    },
  );

  const responseText =
    await response.text();

  if (!response.ok) {
    let message =
      responseText ||
      `HTTP ${response.status}`;

    try {
      const parsed = JSON.parse(
        responseText,
      ) as {
        message?: string;
        error?: string;
      };

      message =
        parsed.message ||
        parsed.error ||
        message;
    } catch {
      // JSON이 아닌 오류 응답은 원문 사용
    }

    throw new BookmarkApiError(
      response.status,
      message,
    );
  }

  /*
   * DELETE 성공 응답은 204이며
   * 응답 본문이 없다.
   */
  if (!responseText) {
    return undefined as T;
  }

  return JSON.parse(
    responseText,
  ) as T;
};

export const createBookmark = (
  payload: CreateBookmarkRequest,
): Promise<BookmarkResponse> =>
  requestBookmarkApi<BookmarkResponse>(
    "/api/bookmarks",
    {
      method: "POST",
      body: payload,
    },
  );

export const getBookmarks =
  (): Promise<BookmarkResponse[]> =>
    requestBookmarkApi<
      BookmarkResponse[]
    >("/api/bookmarks");

export const deleteBookmark = (
  bookmarkId: number,
): Promise<void> =>
  requestBookmarkApi<void>(
    `/api/bookmarks/${bookmarkId}`,
    {
      method: "DELETE",
    },
  );
