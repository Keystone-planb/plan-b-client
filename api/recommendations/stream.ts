import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { API_CONFIG } from "../config";
import type {
  RecommendRequest,
  RecommendationStreamEvent,
  RecommendedPlace,
} from "../../src/types/recommendation";

type StreamHandlers = {
  onProgress?: (message: string, total?: number) => void;
  onPlace?: (place: RecommendedPlace) => void;
  onDone?: () => void;
  onError?: (error: unknown) => void;
};

type NativeStreamResult = {
  completed: boolean;
  receivedText: string;
};

const normalizeBaseUrl = (baseUrl: string) => {
  return baseUrl.replace(/\/+$/, "");
};

const getStreamUrl = () => {
  return `${normalizeBaseUrl(API_CONFIG.BASE_URL)}/api/recommendations/stream`;
};

const parseSseBlock = (block: string): RecommendationStreamEvent | null => {
  const trimmedBlock = block.trim();

  if (!trimmedBlock) {
    return null;
  }

  const lines = trimmedBlock.split(/\r?\n/).map((line) => line.trimEnd());

  let eventName = "";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  const dataText = dataLines.join("\n").trim();

  console.log("[recommendations/stream] parse block:", {
    eventName,
    dataText,
    rawBlock: block,
  });

  if (eventName === "done" || dataText === "[DONE]") {
    return { type: "done" };
  }

  if (!dataText) {
    return null;
  }

  try {
    const parsed = JSON.parse(dataText);

    const inferredEventName =
      eventName ||
      parsed.type ||
      parsed.event ||
      (parsed.place || parsed.placeId || parsed.googlePlaceId || parsed.name ?
        "place"
      : parsed.message || parsed.total ? "progress"
      : "");

    if (inferredEventName === "progress") {
      return {
        type: "progress",
        message: parsed.message ?? "AI가 주변 장소를 분석 중입니다...",
        total: parsed.total,
      };
    }

    if (inferredEventName === "place") {
      return {
        type: "place",
        place: parsed.place ?? parsed,
      };
    }

    if (inferredEventName === "done") {
      return { type: "done" };
    }

    console.log("[recommendations/stream] unknown event:", {
      eventName,
      inferredEventName,
      parsed,
    });
  } catch (error) {
    console.log("[recommendations/stream] SSE parse failed:", {
      block,
      dataText,
      error,
    });
  }

  return null;
};

const dispatchStreamEvent = (
  event: RecommendationStreamEvent,
  handlers: StreamHandlers,
): boolean => {
  console.log("[recommendations/stream] dispatch event:", event.type);

  if (event.type === "progress") {
    handlers.onProgress?.(event.message, event.total);
    return false;
  }

  if (event.type === "place") {
    handlers.onPlace?.(event.place);
    return false;
  }

  if (event.type === "done") {
    handlers.onDone?.();
    return true;
  }

  return false;
};

const consumeSseText = (
  text: string,
  previousBuffer: string,
  handlers: StreamHandlers,
) => {
  let buffer = previousBuffer + text;

  const blocks = buffer.split(/\r?\n\r?\n/);
  buffer = blocks.pop() ?? "";

  for (const block of blocks) {
    const event = parseSseBlock(block);

    if (!event) {
      continue;
    }

    const shouldStop = dispatchStreamEvent(event, handlers);

    if (shouldStop) {
      return {
        buffer,
        shouldStop: true,
      };
    }
  }

  return {
    buffer,
    shouldStop: false,
  };
};

const streamRecommendationsWithFetch = async ({
  url,
  accessToken,
  payload,
  handlers,
}: {
  url: string;
  accessToken: string;
  payload: RecommendRequest;
  handlers: StreamHandlers;
}) => {
  let doneDispatched = false;

  const safeHandlers: StreamHandlers = {
    ...handlers,
    onDone: () => {
      if (doneDispatched) {
        return;
      }

      doneDispatched = true;
      handlers.onDone?.();
    },
  };

  const finishOnce = () => {
    if (doneDispatched) {
      return;
    }

    doneDispatched = true;
    handlers.onDone?.();
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
  });

  console.log("[recommendations/stream] fetch response:", {
    status: response.status,
    ok: response.ok,
    hasBody: Boolean(response.body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.log("[recommendations/stream] fetch error text:", errorText);

    throw new Error(`추천 스트리밍 요청 실패: ${response.status} ${errorText}`);
  }

  if (!response.body) {
    const text = await response.text();

    console.log("[recommendations/stream] fetch full text:", {
      length: text.length,
      text,
    });

    const result = consumeSseText(text, "", safeHandlers);

    if (!result.shouldStop && result.buffer.trim()) {
      const event = parseSseBlock(result.buffer);

      if (event) {
        const shouldStop = dispatchStreamEvent(event, safeHandlers);

        if (shouldStop) {
          return;
        }
      }
    }

    finishOnce();
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    const text = decoder.decode(value, { stream: true });

    console.log("[recommendations/stream] fetch chunk:", text);

    const result = consumeSseText(text, buffer, safeHandlers);

    buffer = result.buffer;

    if (result.shouldStop) {
      return;
    }
  }

  console.log("[recommendations/stream] fetch done:", {
    remainingBuffer: buffer,
  });

  if (buffer.trim()) {
    const event = parseSseBlock(buffer);

    if (event) {
      const shouldStop = dispatchStreamEvent(event, safeHandlers);

      if (shouldStop) {
        return;
      }
    }
  }

  finishOnce();
};

const streamRecommendationsWithXHR = ({
  url,
  accessToken,
  payload,
  handlers,
}: {
  url: string;
  accessToken: string;
  payload: RecommendRequest;
  handlers: StreamHandlers;
}) => {
  return new Promise<NativeStreamResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    let lastIndex = 0;
    let buffer = "";
    let finished = false;
    let doneDispatched = false;

    const safeHandlers: StreamHandlers = {
      ...handlers,
      onDone: () => {
        if (doneDispatched) {
          return;
        }

        doneDispatched = true;
        handlers.onDone?.();
      },
    };

    const finishOnce = (shouldCallDone = true) => {
      if (finished) {
        return;
      }

      finished = true;

      if (shouldCallDone && !doneDispatched) {
        doneDispatched = true;
        handlers.onDone?.();
      }

      resolve({
        completed: true,
        receivedText: xhr.responseText ?? "",
      });
    };

    const failOnce = (error: unknown) => {
      if (finished) {
        return;
      }

      finished = true;
      reject(error);
    };

    xhr.open("POST", url, true);

    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "text/event-stream");

    xhr.timeout = 90000;

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
        console.log("[recommendations/stream] xhr headers received:", {
          status: xhr.status,
          url,
        });

        if (xhr.status < 200 || xhr.status >= 300) {
          failOnce(
            new Error(
              `추천 스트리밍 요청 실패: ${xhr.status} ${xhr.responseText}`,
            ),
          );
        }
      }

      if (xhr.readyState === XMLHttpRequest.DONE) {
        const responseText = xhr.responseText ?? "";

        console.log("[recommendations/stream] xhr done:", {
          status: xhr.status,
          responseLength: responseText.length,
          responseText,
          remainingBuffer: buffer,
        });

        if (xhr.status === 0) {
          const hasReceivedSse =
            responseText.includes("event:") ||
            buffer.includes("event:") ||
            doneDispatched;

          if (hasReceivedSse) {
            console.log(
              "[recommendations/stream] xhr status 0 after SSE, finish safely",
            );
            finishOnce(false);
            return;
          }

          failOnce(
            new Error(
              "추천 스트리밍 연결이 중간에 끊겼습니다. iOS 네트워크 또는 서버 SSE 연결 종료 문제입니다.",
            ),
          );
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          const remainingText = responseText.slice(lastIndex);

          if (remainingText) {
            console.log("[recommendations/stream] xhr remaining text:", {
              remainingText,
            });

            const result = consumeSseText(remainingText, buffer, safeHandlers);
            buffer = result.buffer;

            if (result.shouldStop) {
              finishOnce(false);
              return;
            }
          }

          if (buffer.trim()) {
            console.log("[recommendations/stream] xhr final buffer:", buffer);

            const event = parseSseBlock(buffer);

            if (event) {
              const shouldStop = dispatchStreamEvent(event, safeHandlers);

              if (shouldStop) {
                finishOnce(false);
                return;
              }
            }
          }

          finishOnce(true);
        }
      }
    };

    xhr.onprogress = () => {
      const responseText = xhr.responseText ?? "";
      const chunk = responseText.slice(lastIndex);

      lastIndex = responseText.length;

      if (!chunk) {
        return;
      }

      console.log("[recommendations/stream] xhr chunk:", {
        chunk,
        responseLength: responseText.length,
      });

      const result = consumeSseText(chunk, buffer, safeHandlers);
      buffer = result.buffer;

      if (result.shouldStop) {
        finishOnce(false);
        xhr.abort();
      }
    };

    xhr.onerror = () => {
      if (finished) {
        return;
      }

      failOnce(
        new Error(
          "추천 스트리밍 네트워크 요청에 실패했습니다. 서버 SSE 연결 또는 iOS 네트워크 연결이 중단되었습니다.",
        ),
      );
    };

    xhr.ontimeout = () => {
      failOnce(new Error("추천 스트리밍 요청 시간이 초과되었습니다."));
    };

    xhr.onabort = () => {
      if (!finished) {
        failOnce(new Error("추천 스트리밍 요청이 중단되었습니다."));
      }
    };

    console.log("[recommendations/stream] xhr request:", {
      url,
      payload,
      hasAccessToken: Boolean(accessToken),
    });

    xhr.send(JSON.stringify(payload));
  });
};

export const streamRecommendations = async (
  payload: RecommendRequest,
  handlers: StreamHandlers,
) => {
  const url = getStreamUrl();

  try {
    const accessToken = await AsyncStorage.getItem("access_token");

    if (!accessToken) {
      throw new Error("access_token이 없습니다.");
    }

    console.log("[recommendations/stream] request:", {
      url,
      platform: Platform.OS,
      payload,
      hasAccessToken: Boolean(accessToken),
    });

    if (Platform.OS === "web") {
      await streamRecommendationsWithFetch({
        url,
        accessToken,
        payload,
        handlers,
      });

      return;
    }

    try {
      await streamRecommendationsWithXHR({
        url,
        accessToken,
        payload,
        handlers,
      });
    } catch (firstError) {
      console.log(
        "[recommendations/stream] xhr retry after failure:",
        firstError,
      );

      await streamRecommendationsWithXHR({
        url,
        accessToken,
        payload,
        handlers,
      });
    }
  } catch (error) {
    console.log("[recommendations/stream] failed:", error);

    if (error instanceof Error) {
      console.log("[recommendations/stream] error message:", error.message);
    }

    handlers.onError?.(error);
  }
};
