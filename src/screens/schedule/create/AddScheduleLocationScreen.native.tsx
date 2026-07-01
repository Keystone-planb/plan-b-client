import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { getAnalyzedPlaceDetail } from "../../../../api/places/place";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BookmarkApiError,
  BookmarkResponse,
  createBookmark,
  deleteBookmark,
  getBookmarks,
} from "../../../../api/bookmarks/bookmarks";

import {
  getPlaceDetail,
  getPlaceFreshness,
  getPlaceSummary,
  searchPlaces,
  getPlaceAnalysisStatus,
} from "../../../../api/places/searchPlaces";
import { reanalyzePlace } from "../../../../api/places/place";
import {
  PlaceFreshnessResponse,
  PlaceSearchResult,
  PlaceSummaryResponse,
} from "../../../../api/places/place";
import { reportPreferenceFeedback } from "../../../../api/preferences/preferences";
import { addTripLocation, createTrip } from "../../../../api/schedules/server";
import { trackEvent, AMP } from "../../../utils/amplitude";
import SearchResultCard from "../../../components/location/SearchResultCard";
import PlaceDetailBottomSheet from "../../../components/location/PlaceDetailBottomSheet";
import { usePlaceReview } from "../../../hooks/location/usePlaceReview";
import {
  createKeywordsFromReviews,
  createReviewSummaryFromReviews,
  formatConfidenceScore,
  getDetailReviews,
  getFreshnessLabel,
  getMoodLabel,
  getPlaceTypeLabel,
  getSpaceLabel,
  isMockLikeSummary,
  isUsefulReviewText,
  shortenAddress,
} from "../../../utils/location/reviewUtils";

type Props = {
  navigation: any;
  route: {
    params?: {
      scheduleId?: string;
      day?: number;
      selectedDay?: number;
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      tripId?: number | string;
      serverTripId?: number | string;
      transportMode?: "WALK" | "TRANSIT" | "CAR";
      transportLabel?: string;
    };
  };
};

type SelectedPlace = {
  placeId: string;
  googlePlaceId?: string;
  name: string;
  address?: string;
  rating?: number;
  category?: string;
  latitude?: number;
  longitude?: number;
};

type PlaceReviewInfo = {
  detail?: unknown;
  summary?: PlaceSummaryResponse;
  freshness?: PlaceFreshnessResponse;
};

type BookmarkPlace = PlaceSearchResult & {
  bookmarkId: number;
  createdAt?: string;
};

const getUniquePlaces = <T extends { placeId: string; googlePlaceId?: string }>(
  places: T[],
) => {
  const seen = new Set<string>();

  return places.filter((place) => {
    const keySource = place.googlePlaceId ?? place.placeId;
    if (!keySource) {
      return false;
    }

    const key = String(keySource);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const INITIAL_REGION = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.014,
  longitudeDelta: 0.014,
};

/*
 * SHEET_DOWN_TOGGLE_FIX
 *
 * 기본 상태는 기존처럼 지도가 335 높이로 보인다.
 * 핸들을 누르면 지도 영역이 커지면서
 * 바텀시트가 화면 아래 방향으로 내려간다.
 */
const MAP_HEIGHT_WHEN_SHEET_EXPANDED = 335;


const REVIEW_TEXT_MAX_LENGTH = 80;

const getReviewPlaceKey = (place: PlaceSearchResult) => {
  const keySource = place.googlePlaceId ?? place.placeId;
  return keySource ? String(keySource) : "";
};

const unwrapApiData = (source: unknown) => {
  if (!source || typeof source !== "object") {
    return source;
  }

  const objectSource = source as Record<string, unknown>;

  return (
    objectSource.data ??
    objectSource.result ??
    objectSource.response ??
    objectSource.payload ??
    objectSource.body ??
    objectSource
  );
};

const getValueByPath = (source: unknown, path: string): unknown => {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, source);
};

const normalizeTextValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeTextValue(item))
      .filter(Boolean)
      .join(" ");
  }

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    const preferred =
      objectValue.text ??
      objectValue.summary ??
      objectValue.reviewSummary ??
      objectValue.content ??
      objectValue.review ??
      objectValue.message ??
      objectValue.description ??
      objectValue.aiSummary;

    return normalizeTextValue(preferred);
  }

  return "";
};

const getFirstText = (source: unknown, paths: string[]) => {
  for (const path of paths) {
    const value = normalizeTextValue(getValueByPath(source, path));

    if (value) {
      return value;
    }
  }

  return "";
};

const getFirstArray = (source: unknown, paths: string[]) => {
  for (const path of paths) {
    const value = getValueByPath(source, path);

    if (Array.isArray(value)) {
      const normalized = value
        .map((item) => normalizeTextValue(item))
        .filter(Boolean);

      if (normalized.length > 0) {
        return normalized;
      }
    }
  }

  return [];
};

const getNumberByPath = (source: unknown, paths: string[]) => {
  for (const path of paths) {
    const value = getValueByPath(source, path);

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
};

const truncateText = (text: string, maxLength = REVIEW_TEXT_MAX_LENGTH) => {
  const normalized = text.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
};


const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const hasUsefulReviewPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return false;

  const target = payload as Record<string, any>;

  // AI가 생성한 요약 필드(reviewSummary/aiSummary)만 "분석 완료" 신호로 본다.
  // googleReview/naverReview에는 원문이 그대로 들어올 수 있어 판정에서 제외한다.
  return [
    target.reviewSummary,
    target.aiSummary,
    target.summary,
    target.data?.reviewSummary,
    target.data?.aiSummary,
    target.result?.reviewSummary,
    target.result?.aiSummary,
  ].some(isUsefulReviewText);
};

const isAnalysisStatusCompleted = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return false;

  const statusObject = payload as Record<string, any>;
  const status = String(
    statusObject.status ??
      statusObject.analysisStatus ??
      statusObject.data?.status ??
      statusObject.result?.status ??
      "",
  ).toUpperCase();

  return (
    status === "COMPLETE" ||
    status === "COMPLETED" ||
    status === "DONE" ||
    status === "SUCCESS" ||
    status === "READY" ||
    statusObject.ready === true ||
    statusObject.completed === true ||
    statusObject.isCompleted === true ||
    statusObject.isAnalyzed === true
  );
};

export default function AddScheduleLocationScreen({
  navigation,
  route,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();

  const inputRef = useRef<TextInput>(null);
  const submitLockRef = useRef(false);
  const mapRef = useRef<MapView>(null);
  const keyboardVisibleRef = useRef(false);

  const mapHeightWhenSheetCollapsed = useMemo(
    () =>
      Math.min(
        Math.max(windowHeight - 185, 515),
        680,
      ),
    [windowHeight],
  );

  const mapHeightSnapMidpoint = useMemo(
    () =>
      (
        mapHeightWhenSheetCollapsed +
        MAP_HEIGHT_WHEN_SHEET_EXPANDED
      ) / 2,
    [mapHeightWhenSheetCollapsed],
  );

  const mapSectionHeight = useRef(
    new Animated.Value(
      MAP_HEIGHT_WHEN_SHEET_EXPANDED,
    ),
  ).current;

  const mapSectionHeightValueRef = useRef(
    MAP_HEIGHT_WHEN_SHEET_EXPANDED,
  );

  const sheetDragStartHeightRef = useRef(
    MAP_HEIGHT_WHEN_SHEET_EXPANDED,
  );

  const animateBottomSheetTo = (
    mapHeight: number,
  ) => {
    const safeMapHeight = Math.max(
      MAP_HEIGHT_WHEN_SHEET_EXPANDED,
      Math.min(
        mapHeightWhenSheetCollapsed,
        mapHeight,
      ),
    );

    mapSectionHeight.stopAnimation();

    Animated.spring(mapSectionHeight, {
      toValue: safeMapHeight,
      useNativeDriver: false,
      damping: 22,
      stiffness: 220,
      mass: 0.8,
      overshootClamping: true,
    }).start();
  };

  const toggleBottomSheet = () => {
    const shouldExpand =
      mapSectionHeightValueRef.current >=
      mapHeightSnapMidpoint;

    animateBottomSheetTo(
      shouldExpand
        ? MAP_HEIGHT_WHEN_SHEET_EXPANDED
        : mapHeightWhenSheetCollapsed,
    );
  };

  const finishBottomSheetDrag = (
    velocityY: number,
  ) => {
    const currentHeight =
      mapSectionHeightValueRef.current;

    const shouldExpand =
      velocityY < -0.35 ||
      (velocityY <= 0.35 &&
        currentHeight <
          mapHeightSnapMidpoint);

    animateBottomSheetTo(
      shouldExpand
        ? MAP_HEIGHT_WHEN_SHEET_EXPANDED
        : mapHeightWhenSheetCollapsed,
    );
  };

  const bottomSheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        false,

      onMoveShouldSetPanResponder: (
        _,
        gestureState,
      ) => {
        if (keyboardVisibleRef.current) {
          return false;
        }

        return (
          Math.abs(gestureState.dy) > 6 &&
          Math.abs(gestureState.dy) >
            Math.abs(gestureState.dx)
        );
      },

      onMoveShouldSetPanResponderCapture: (
        _,
        gestureState,
      ) => {
        if (keyboardVisibleRef.current) {
          return false;
        }

        return (
          Math.abs(gestureState.dy) > 6 &&
          Math.abs(gestureState.dy) >
            Math.abs(gestureState.dx)
        );
      },

      onPanResponderGrant: () => {
        sheetDragStartHeightRef.current =
          mapSectionHeightValueRef.current;
      },

      onPanResponderMove: (
        _,
        gestureState,
      ) => {
        const nextHeight = Math.max(
          MAP_HEIGHT_WHEN_SHEET_EXPANDED,
          Math.min(
            mapHeightWhenSheetCollapsed,
            sheetDragStartHeightRef.current +
              gestureState.dy,
          ),
        );

        mapSectionHeight.setValue(
          nextHeight,
        );
      },

      onPanResponderRelease: (
        _,
        gestureState,
      ) => {
        finishBottomSheetDrag(
          gestureState.vy,
        );
      },

      onPanResponderTerminate: (
        _,
        gestureState,
      ) => {
        finishBottomSheetDrag(
          gestureState.vy,
        );
      },

      onPanResponderTerminationRequest:
        () => false,
    }),
  ).current;

  useEffect(() => {
    const listenerId =
      mapSectionHeight.addListener(
        ({ value }) => {
          mapSectionHeightValueRef.current =
            value;
        },
      );

    return () => {
      mapSectionHeight.removeListener(
        listenerId,
      );
    };
  }, [mapSectionHeight]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios"
        ? "keyboardWillShow"
        : "keyboardDidShow";

    const hideEvent =
      Platform.OS === "ios"
        ? "keyboardWillHide"
        : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(
      showEvent,
      () => {
        keyboardVisibleRef.current = true;
      },
    );

    const hideSubscription = Keyboard.addListener(
      hideEvent,
      () => {
        keyboardVisibleRef.current = false;
      },
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const currentHeight =
      mapSectionHeightValueRef.current;

    const nextHeight = Math.max(
      MAP_HEIGHT_WHEN_SHEET_EXPANDED,
      Math.min(
        mapHeightWhenSheetCollapsed,
        currentHeight,
      ),
    );

    if (nextHeight !== currentHeight) {
      mapSectionHeight.stopAnimation();
      mapSectionHeight.setValue(nextHeight);
      mapSectionHeightValueRef.current =
        nextHeight;
    }
  }, [
    mapHeightWhenSheetCollapsed,
    mapSectionHeight,
  ]);

  const tripName = route?.params?.tripName ?? "";
  const startDate = route?.params?.startDate ?? "";
  const endDate = route?.params?.endDate ?? "";
  const scheduleId = route?.params?.scheduleId;
  const existingTripId = route?.params?.tripId;
  const existingServerTripId = route?.params?.serverTripId;
  const existingLocation = route?.params?.location ?? "";
  const day = route?.params?.day;
  const selectedDay = route?.params?.selectedDay ?? day ?? 1;
  const transportMode = route?.params?.transportMode ?? "WALK";
  const transportLabel = route?.params?.transportLabel ?? "도보";

  const hasExistingSchedule = Boolean(
    scheduleId || existingTripId || existingServerTripId,
  );

  const resolvedExistingTripId = existingServerTripId ?? existingTripId;

  const [keyword, setKeyword] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [detailLoadingPlaceId, setDetailLoadingPlaceId] = useState<
    string | null
  >(null);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [focusedCoord, setFocusedCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<SelectedPlace[]>([]);

  const [activeResultTab, setActiveResultTab] = useState<
    "search" | "favorites"
  >("search");

  const [favoritePlaces, setFavoritePlaces] = useState<
    BookmarkPlace[]
  >([]);

  const [favoriteListLoading, setFavoriteListLoading] =
    useState(false);
  const [favoriteListLoaded, setFavoriteListLoaded] =
    useState(false);

  const [
    bookmarkActionPlaceId,
    setBookmarkActionPlaceId,
  ] = useState<string | null>(null);

  const [businessHoursExpanded, setBusinessHoursExpanded] = useState(false);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("PlanA", {
      scheduleId,
      tripId: resolvedExistingTripId,
      serverTripId: resolvedExistingTripId,
      tripName,
      startDate,
      endDate,
      location: existingLocation,
      transportMode,
      transportLabel,
    });
  };

  const moveMapToPlace = (place: SelectedPlace) => {
    mapRef.current?.animateToRegion(
      {
        latitude: place.latitude ?? INITIAL_REGION.latitude,
        longitude: place.longitude ?? INITIAL_REGION.longitude,
        latitudeDelta: 0.014,
        longitudeDelta: 0.014,
      },
      350,
    );
  };

  // 검색 결과에는 좌표가 없으므로, 좌표가 없으면 상세조회(getPlaceDetail)로 가져와 지도를 이동한다.
  // getPlaceDetail은 내부 캐시가 있어 같은 장소 재조회 시 추가 네트워크 호출이 없다.
  const focusMapOnPlace = async (place: {
    placeId?: string | number;
    googlePlaceId?: string;
    latitude?: number | null;
    longitude?: number | null;
  }) => {
    const moveTo = (latitude: number, longitude: number) => {
      setFocusedCoord({ latitude, longitude });
      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.014,
          longitudeDelta: 0.014,
        },
        350,
      );
    };

    if (
      typeof place.latitude === "number" &&
      typeof place.longitude === "number"
    ) {
      moveTo(place.latitude, place.longitude);
      return;
    }

    const detailId = place.googlePlaceId ?? place.placeId;
    if (!detailId) return;

    try {
      const detail = await getPlaceDetail(detailId);
      const lat =
        typeof detail.latitude === "number" ? detail.latitude : detail.lat;
      const lng =
        typeof detail.longitude === "number" ? detail.longitude : detail.lng;

      if (typeof lat === "number" && typeof lng === "number") {
        moveTo(lat, lng);
      } else if (__DEV__) {
              }
    } catch (error) {
      if (__DEV__) {
              }
    }
  };

  const toggleSelectedPlace = (place: SelectedPlace) => {
    setSelectedPlaces((prev) => {
      const alreadySelected = prev.some(
        (item) => item.placeId === place.placeId,
      );

      if (alreadySelected) {
        return prev.filter((item) => item.placeId !== place.placeId);
      }

      return [...prev, place];
    });
  };

  const normalizeBookmarkPlace = (
    bookmark: BookmarkResponse,
  ): BookmarkPlace => ({
    bookmarkId: bookmark.bookmarkId,
    placeId: bookmark.googlePlaceId,
    googlePlaceId: bookmark.googlePlaceId,
    name:
      bookmark.name?.trim() ||
      bookmark.category?.trim() ||
      "저장한 장소",
    category: bookmark.category ?? undefined,
    address: bookmark.address ?? "주소 정보 없음",
    latitude:
      typeof bookmark.lat === "number"
        ? bookmark.lat
        : undefined,
    longitude:
      typeof bookmark.lng === "number"
        ? bookmark.lng
        : undefined,
    createdAt: bookmark.createdAt,
  });

  const loadFavoritePlaces = async (
    showErrorAlert = false,
  ) => {
    try {
      setFavoriteListLoading(true);

      const bookmarks = await getBookmarks();
      const normalizedBookmarks =
        bookmarks.map(normalizeBookmarkPlace);

      
      setFavoritePlaces(normalizedBookmarks);
      setFavoriteListLoaded(true);
    } catch (error) {
      
      if (showErrorAlert) {
        const message =
          error instanceof BookmarkApiError &&
          error.status === 401
            ? "로그인이 만료되었습니다. 다시 로그인해 주세요."
            : "즐겨찾기 목록을 불러오지 못했습니다.";

        Alert.alert(
          "즐겨찾기 조회 실패",
          message,
        );
      }
    } finally {
      setFavoriteListLoading(false);
    }
  };

  useEffect(() => {
    // 즐겨찾기는 일자별 목록이 아니므로
    // 일자 변경 후에도 서버 전체 목록을 다시 불러온다.
    void loadFavoritePlaces();
  }, [selectedDay]);

  useEffect(() => {
    const unsubscribe = navigation.addListener(
      "focus",
      () => {
        void loadFavoritePlaces();
      },
    );

    return unsubscribe;
  }, [navigation]);

  const toggleFavoritePlace = async (
    place: PlaceSearchResult,
  ) => {
    const placeKey = getReviewPlaceKey(place);

    if (!placeKey || bookmarkActionPlaceId) {
      return;
    }

    const existingBookmark = favoritePlaces.find(
      (item) => getReviewPlaceKey(item) === placeKey,
    );

    const previousFavoritePlaces = favoritePlaces;

    const optimisticBookmark: BookmarkPlace = {
      ...place,
      bookmarkId: -Date.now(),
      placeId: placeKey,
      googlePlaceId: placeKey,
      createdAt: new Date().toISOString(),
    };

    try {
      setBookmarkActionPlaceId(placeKey);

      // 누르는 즉시 UI 반영
      if (existingBookmark) {
        setFavoritePlaces((prev) =>
          prev.filter(
            (item) => getReviewPlaceKey(item) !== placeKey,
          ),
        );
      } else {
        setFavoritePlaces((prev) => [
          optimisticBookmark,
          ...prev.filter(
            (item) => getReviewPlaceKey(item) !== placeKey,
          ),
        ]);
      }

      if (existingBookmark) {
        await deleteBookmark(existingBookmark.bookmarkId);
        return;
      }

      let latitude = place.latitude;
      let longitude = place.longitude;

      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number"
      ) {
        try {
          const detail = await getPlaceDetail(placeKey);

          latitude =
            typeof detail.latitude === "number"
              ? detail.latitude
              : detail.lat;

          longitude =
            typeof detail.longitude === "number"
              ? detail.longitude
              : detail.lng;
        } catch (detailError) {
                  }
      }

      const createdBookmark = await createBookmark({
        googlePlaceId: placeKey,
        name: place.name,
        category: place.category,
        address: place.address,
        lat:
          typeof latitude === "number"
            ? latitude
            : undefined,
        lng:
          typeof longitude === "number"
            ? longitude
            : undefined,
      });

      const savedFavorite =
        normalizeBookmarkPlace(createdBookmark);

      // 임시 즐겨찾기를 서버 응답 데이터로 교체
      setFavoritePlaces((prev) => [
        savedFavorite,
        ...prev.filter(
          (item) => getReviewPlaceKey(item) !== placeKey,
        ),
      ]);
    } catch (error) {
      // 실패 시 이전 상태로 복구
      setFavoritePlaces(previousFavoritePlaces);

      
      if (
        error instanceof BookmarkApiError &&
        error.status === 409
      ) {
        await loadFavoritePlaces();

        Alert.alert(
          "즐겨찾기",
          "이미 즐겨찾기에 추가된 장소입니다.",
        );
        return;
      }

      if (
        error instanceof BookmarkApiError &&
        error.status === 404
      ) {
        await loadFavoritePlaces();

        Alert.alert(
          "즐겨찾기",
          "이미 삭제된 즐겨찾기입니다.",
        );
        return;
      }

      const message =
        error instanceof BookmarkApiError &&
        error.status === 401
          ? "로그인이 만료되었습니다. 다시 로그인해 주세요."
          : error instanceof BookmarkApiError &&
              error.status === 403
            ? "본인의 즐겨찾기만 삭제할 수 있습니다."
            : existingBookmark
              ? "즐겨찾기에서 삭제하지 못했습니다."
              : "즐겨찾기에 추가하지 못했습니다.";

      Alert.alert(
        "즐겨찾기 처리 실패",
        message,
      );
    } finally {
      setBookmarkActionPlaceId(null);
    }
  };

  const handleSearch = async () => {
    const trimmedKeyword = keyword.trim();

    
    if (!trimmedKeyword || searchLoading || submitLoading) {
      return;
    }

    try {
      setSearchLoading(true);
      setExpandedPlaceId(null);

      const places = await searchPlaces(trimmedKeyword);

      
      setSearchResults(places);
      setActiveResultTab("search");
      Keyboard.dismiss();

      // 검색 후 가장 위에 뜨는 장소로 지도를 자동 이동한다(좌표는 상세조회로 보강).
      if (places[0]) {
        focusMapOnPlace(places[0]);
      }
    } catch (error) {
      
      setSearchResults([]);
      setExpandedPlaceId(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmitEditing = () => {
    handleSearch();
  };

  const handlePlaceDetail = async (place: PlaceSearchResult) => {
    const placeId = String(place.placeId);
    const googlePlaceIdSource = place.googlePlaceId ?? place.placeId;
    if (!googlePlaceIdSource) {
      Alert.alert(
        "상세 정보 조회 실패",
        "장소 식별값이 없어 상세 정보를 불러올 수 없어요.",
      );
      return;
    }

    const googlePlaceId = String(googlePlaceIdSource);
    const hasSearchCoordinate =
      typeof place.latitude === "number" && typeof place.longitude === "number";

    try {
      setDetailLoadingPlaceId(placeId);

      const detail =
        hasSearchCoordinate ? null : (
          await getAnalyzedPlaceDetail(googlePlaceId)
        );

      const nextPlace: SelectedPlace = {
        placeId,
        googlePlaceId,
        name: place.name,
        address: place.address,
        rating: place.rating,
        category: place.category,
        latitude: detail?.lat ?? place.latitude,
        longitude: detail?.lng ?? place.longitude,
      };

      toggleSelectedPlace(nextPlace);
      setKeyword(place.name);
      moveMapToPlace(nextPlace);

      const storedUserId = await AsyncStorage.getItem("user_id");

      if (!storedUserId) {
        console.warn("[preference feedback] user_id 없음. feedback 호출 생략");
        return;
      }

      reportPreferenceFeedback({
        userId: storedUserId,
        placeId: googlePlaceId,
        feedbackType: "SELECT",
        reason: "ADD_SCHEDULE_LOCATION_SELECT",
      }).catch((error) => {
        console.warn("[preferences/feedback] 호출 실패", error);
      });
    } catch (error) {
      
      const fallbackPlace: SelectedPlace = {
        placeId,
        googlePlaceId,
        name: place.name,
        address: place.address,
        rating: place.rating,
        category: place.category,
        latitude: place.latitude,
        longitude: place.longitude,
      };

      toggleSelectedPlace(fallbackPlace);
      setKeyword(place.name);
      moveMapToPlace(fallbackPlace);
    } finally {
      setDetailLoadingPlaceId(null);
    }
  };

  const hasAnalyzedTagsInDetail = (detail: unknown) => {
    if (!detail || typeof detail !== "object") return false;
    const target = detail as Record<string, any>;
    const tags = target.tags;

    if (tags && typeof tags === "object" && !Array.isArray(tags)) {
      if (
        (Array.isArray(tags.space) && tags.space.length > 0) ||
        (Array.isArray(tags.type) && tags.type.length > 0) ||
        (Array.isArray(tags.mood) && tags.mood.length > 0)
      ) {
        return true;
      }
    }

    return Boolean(
      target.spaceTags?.length ||
      target.typeTags?.length ||
      target.moodTags?.length ||
      target.space ||
      target.type ||
      target.mood,
    );
  };

  const {
    expandedPlaceId,
    setExpandedPlaceId,
    reviewLoadingPlaceId,
    placeReviewMap,
    reanalyzeSuccessMessage,
    reanalyzeLoadingPlaceId,
    reanalyzeLoadingMessage,
    handleTogglePlaceReview,
    handleReanalyzePlace,
  } = usePlaceReview<PlaceSearchResult>({
    getReviewPlaceKey,
    getPlaceDetail,
    getPlaceSummary,
    getPlaceAnalysisStatus,
    reanalyzePlace,
    hasUsefulReviewPayload,
    hasAnalyzedTagsInDetail,
    isAnalysisStatusCompleted,
    unwrapApiData,
    wait,
  });

  const navigateToPlanAWithPlaces = ({
    targetScheduleId,
    targetTripId,
    targetServerTripId,
    targetLocation,
    serverPlaceMap,
    placesToNavigate,
  }: {
    targetScheduleId?: string;
    targetTripId?: number | string;
    targetServerTripId?: number | string;
    targetLocation: string;
    serverPlaceMap?: Record<string, { tripPlaceId?: number | string }>;
    placesToNavigate?: SelectedPlace[];
  }) => {
    const navigationPlaces = placesToNavigate ?? selectedPlaces;

    if (navigationPlaces.length === 0) {
      return;
    }

    navigation.navigate("PlanA", {
      scheduleId: targetScheduleId,
      tripId: targetTripId,
      serverTripId: targetServerTripId,
      tripName,
      startDate,
      endDate,
      location: targetLocation,
      transportMode,
      transportLabel,
      selectedDay,
      day: selectedDay,
      isEditMode: true,
      refreshPlanAAt: Date.now(),
      selectedPlaces: navigationPlaces.map((place) => {
        const serverPlace = serverPlaceMap?.[place.placeId];

        return {
          id: place.placeId,
          placeId: place.placeId,
          googlePlaceId: place.googlePlaceId ?? place.placeId,
          tripPlaceId: serverPlace?.tripPlaceId,
          serverTripPlaceId: serverPlace?.tripPlaceId,
          name: place.name,
          address: place.address,
          category: place.category,
          latitude: place.latitude,
          longitude: place.longitude,
          day: selectedDay,
          time: "",
        };
      }),
    });
  };

  const handleNext = async (overridePlaces?: SelectedPlace[]) => {
    if (submitLoading || submitLockRef.current) {
            return;
    }

    submitLockRef.current = true;

    const placesToSubmit = getUniquePlaces(overridePlaces ?? selectedPlaces);

    const duplicatePlaceIds = new Set<string>();

    const filteredPlacesToSubmit = placesToSubmit.filter((place) => {
      const key = String(
        place.placeId ??
        place.googlePlaceId ??
        "",
      );

      if (!key) return true;

      if (duplicatePlaceIds.has(key)) {

        return false;
      }

      duplicatePlaceIds.add(key);
      return true;
    });
    if (placesToSubmit.length === 0) {
      submitLockRef.current = false;
      return;
    }

    if (!tripName || !startDate || !endDate) {
      submitLockRef.current = false;
      Alert.alert("알림", "여행 이름과 날짜 정보가 없습니다.");
      return;
    }

    const primaryPlace = placesToSubmit[0];

    const nextLocation =
      primaryPlace?.name ||
      primaryPlace?.address ||
      existingLocation ||
      "선택한 장소";

    let targetTripId = resolvedExistingTripId;
    let targetServerTripId = resolvedExistingTripId;
    const serverPlaceMap: Record<string, { tripPlaceId?: number | string }> =
      {};

    try {
      setSubmitLoading(true);

      try {
        if (!targetServerTripId) {
          const tripResponse = await createTrip({
            title: tripName,
            startDate,
            endDate,
            travelStyles: ["HEALING"],
          });

          targetTripId = tripResponse.tripId;
          targetServerTripId = tripResponse.tripId;

          // 새 여행 생성 완료
          const start = new Date(startDate.replace(/\./g, "-"));
          const end = new Date(endDate.replace(/\./g, "-"));
          const durationDays = Math.max(
            1,
            Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
          );
          trackEvent(AMP.TRIP_CREATED, {
            trip_id: String(tripResponse.tripId),
            destination: existingLocation || nextLocation || "",
            duration_days: durationDays,
            transport_mode: transportMode ?? "WALK",
          });
        }

        if (targetServerTripId) {
          for (const place of filteredPlacesToSubmit) {

            const response = await addTripLocation(
              targetServerTripId,
              selectedDay,
              {
                place_id: place.googlePlaceId ?? place.placeId,
                name: place.name,
                category: place.category,
                visitTime: null,
                endTime: null,
                memo: null,
                transportMode,
              },
            );


            serverPlaceMap[place.placeId] = {
              tripPlaceId: response.tripPlaceId,
            };

            // 장소 추가 이벤트
            trackEvent(AMP.PLACE_ADDED, {
              trip_id: String(targetServerTripId),
              trip_day: selectedDay,
              place_id: place.googlePlaceId ?? place.placeId,
              place_name: place.name,
              place_category: place.category ?? "",
              source: "search",
            });
          }
        }

              } catch (serverError) {
              }

      navigateToPlanAWithPlaces({
        targetScheduleId: scheduleId,
        targetTripId,
        targetServerTripId,
        targetLocation: existingLocation || nextLocation,
        serverPlaceMap,
        placesToNavigate: placesToSubmit,
      });
    } catch (error) {
      
      const message =
        error instanceof Error ?
          error.message
        : "여행 일정을 저장하지 못했습니다.";

      Alert.alert("일정 저장 실패", message);
    } finally {
      submitLockRef.current = false;
      setSubmitLoading(false);
    }
  };

  const placesToRender =
    activeResultTab === "favorites"
      ? favoritePlaces
      : searchResults.length > 0
        ? searchResults
        : [
            {
              placeId: "empty-preview-1",
              name: "장소를 검색해주세요",
              address:
                "검색어를 입력하면 장소 후보가 표시됩니다.",
              rating: undefined,
              category: "preview",
            } as PlaceSearchResult,
          ];

  const mapPlaces =
    activeResultTab === "favorites"
      ? favoritePlaces
      : searchResults;

  const detailModalPlace = [
    ...searchResults,
    ...favoritePlaces,
  ].find((place) => {
    return (
      getReviewPlaceKey(place) === expandedPlaceId
    );
  });

  const detailModalPlaceId =
    detailModalPlace ? getReviewPlaceKey(detailModalPlace) : "";

  const detailModalReviewInfo =
    detailModalPlaceId ? placeReviewMap[detailModalPlaceId] : undefined;

  const rawDetailModalDetail = detailModalReviewInfo?.detail as unknown;
  const rawDetailModalSummary = detailModalReviewInfo?.summary as unknown;
  const rawDetailModalFreshness = detailModalReviewInfo?.freshness as unknown;

  const detailModalDetail = unwrapApiData(rawDetailModalDetail);
  const detailModalSummary = unwrapApiData(rawDetailModalSummary);
  const detailModalFreshness = unwrapApiData(rawDetailModalFreshness);

  const rawAiSummary = getFirstText(detailModalSummary, [
    "ai_summary",
    "ai_summary",
    "ai_summary",
    "ai_summary",
    "aiSummary",
    "summary",
    "reviewSummary",
    "placeSummary",
    "content",
    "message",
    "description",
    "overallSummary",
    "totalSummary",
    "data.ai_summary",
    "data.ai_summary",
    "data.ai_summary",
    "data.ai_summary",
    "data.aiSummary",
    "data.summary",
    "data.reviewSummary",
    "data.placeSummary",
    "result.ai_summary",
    "result.ai_summary",
    "result.ai_summary",
    "result.ai_summary",
    "result.aiSummary",
    "result.summary",
    "payload.ai_summary",
    "payload.ai_summary",
    "payload.ai_summary",
    "payload.ai_summary",
    "payload.aiSummary",
    "payload.summary",
  ]);

  const detailModalRawGoogleReviews = useMemo(() => {
    return getDetailReviews(detailModalDetail).slice(0, 5);
  }, [detailModalDetail]);

  const detailModalReviews = useMemo(() => {
    const getPlatformReviewText = (paths: string[]) => {
      const summaryText = getFirstText(detailModalSummary, paths).trim();
      const detailText = getFirstText(detailModalDetail, paths).trim();

      return summaryText || detailText;
    };

    const googleAiReviewText = getPlatformReviewText([
      "googleReview",
      "data.googleReview",
      "result.googleReview",
      "payload.googleReview",
    ]);

    const googleRawReviewText = detailModalRawGoogleReviews
      .map((review) => {
        const ratingText =
          typeof review.rating === "number" ?
            `평점 ${review.rating.toFixed(1)}`
          : "리뷰";

        const timeText =
          review.relativeTimeDescription ?
            ` · ${review.relativeTimeDescription}`
          : "";

        return `${ratingText}${timeText}\n${truncateText(
          review.text,
          REVIEW_TEXT_MAX_LENGTH,
        )}`;
      })
      .filter(Boolean)
      .join("\n\n");

    const googleReviewText =
      isUsefulReviewText(googleAiReviewText) ? googleAiReviewText
      : isUsefulReviewText(googleRawReviewText) ? googleRawReviewText
      : "Google 리뷰 정보가 없습니다.";

    const naverReviewText = getPlatformReviewText([
      "naverReview",
      "data.naverReview",
      "result.naverReview",
      "payload.naverReview",
    ]);

    return [
      {
        id: "googleReview",
        platform: "Google",
        logoType: "google",
        text: truncateText(googleReviewText, REVIEW_TEXT_MAX_LENGTH),
      },
      {
        id: "naverReview",
        platform: "Naver",
        logoType: "naver",
        text:
          isUsefulReviewText(naverReviewText) ?
            truncateText(naverReviewText, REVIEW_TEXT_MAX_LENGTH)
          : "Naver 리뷰 정보가 없습니다.",
      },
    ];
  }, [detailModalDetail, detailModalRawGoogleReviews, detailModalSummary]);

  const reviewBasedSummary = createReviewSummaryFromReviews(
    detailModalRawGoogleReviews,
  );

  const rawDetailReviewSummary = getFirstText(detailModalDetail, [
    "reviewSummary",
    "data.reviewSummary",
    "result.reviewSummary",
    "payload.reviewSummary",
  ]);

  const detailModalAiSummary =
    ((
      rawAiSummary.includes("분석된 리뷰 정보가 없습니다") ||
      rawAiSummary.includes("데이터 부족") ||
      isMockLikeSummary(rawAiSummary)
    ) ?
      ""
    : rawAiSummary.trim()) ||
    ((
      rawDetailReviewSummary.includes("분석된 리뷰 정보가 없습니다") ||
      rawDetailReviewSummary.includes("데이터 부족") ||
      isMockLikeSummary(rawDetailReviewSummary)
    ) ?
      ""
    : rawDetailReviewSummary.trim()) ||
    reviewBasedSummary ||
    "리뷰 정보가 없습니다.";

  const detailModalKeywords = useMemo(() => {
    return createKeywordsFromReviews(detailModalRawGoogleReviews);
  }, [detailModalRawGoogleReviews]);

  const detailModalFreshnessStatus = getFirstText(detailModalFreshness, [
    "status",
    "freshnessStatus",
    "data.status",
    "result.status",
  ]);

  const detailModalFreshnessLabel = getFreshnessLabel(
    detailModalFreshnessStatus,
  );

  const detailModalLastUpdated = getFirstText(detailModalFreshness, [
    "lastUpdated",
    "updatedAt",
    "lastSyncedAt",
    "data.lastUpdated",
    "data.updatedAt",
    "data.lastSyncedAt",
    "result.lastUpdated",
    "result.updatedAt",
    "result.lastSyncedAt",
  ]);

  const detailModalConfidenceScore = formatConfidenceScore(
    getNumberByPath(detailModalFreshness, [
      "confidenceScore",
      "score",
      "data.confidenceScore",
      "result.confidenceScore",
    ]),
  );

  const hasFreshnessInfo = Boolean(
    detailModalFreshnessLabel ||
    detailModalLastUpdated ||
    detailModalConfidenceScore,
  );

  const detailModalOpeningHours =
    getFirstText(detailModalDetail, [
      "openingHours",
      "businessHours",
      "hours",
      "openHours",
      "operatingHours",
      "data.openingHours",
      "data.businessHours",
      "result.openingHours",
      "result.businessHours",
    ]) ||
    getFirstText(detailModalSummary, [
      "openingHours",
      "businessHours",
      "hours",
      "openHours",
      "operatingHours",
      "data.openingHours",
      "data.businessHours",
      "result.openingHours",
      "result.businessHours",
    ]) ||
    getFirstText(detailModalFreshness, [
      "openingHours",
      "businessHours",
      "hours",
      "openHours",
      "operatingHours",
      "data.openingHours",
      "data.businessHours",
      "result.openingHours",
      "result.businessHours",
    ]) ||
    getFirstText(detailModalPlace, [
      "openingHours",
      "businessHours",
      "hours",
    ]) ||
    "운영 시간 정보 없음";

  const modalAddress = shortenAddress(
    getFirstText(detailModalDetail, [
      "address",
      "formattedAddress",
      "data.address",
      "result.address",
    ]) || detailModalPlace?.address,
  );

  const modalRating =
    getNumberByPath(detailModalDetail, [
      "rating",
      "data.rating",
      "result.rating",
    ]) ?? detailModalPlace?.rating;

  const formattedOpeningHours =
    (
      detailModalOpeningHours &&
      detailModalOpeningHours !== "운영 시간 정보 없음"
    ) ?
      detailModalOpeningHours
        .split(" / ")
        .map((item) => item.trim())
        .filter(Boolean)
        .join("\n")
    : "";

  const detailRaw = detailModalDetail as any;
  const summaryRaw = detailModalSummary as any;

  const serverDetailTags = [
    getSpaceLabel(
      detailRaw?.tags?.space ??
        detailRaw?.data?.tags?.space ??
        detailRaw?.result?.tags?.space ??
        detailRaw?.payload?.tags?.space ??
        detailRaw?.space ??
        detailRaw?.spaceType ??
        summaryRaw?.tags?.space ??
        summaryRaw?.data?.tags?.space ??
        summaryRaw?.result?.tags?.space ??
        summaryRaw?.payload?.tags?.space ??
        summaryRaw?.space ??
        summaryRaw?.spaceType,
    ),
    getPlaceTypeLabel(
      detailRaw?.tags?.type ??
        detailRaw?.data?.tags?.type ??
        detailRaw?.result?.tags?.type ??
        detailRaw?.payload?.tags?.type ??
        detailRaw?.type ??
        detailRaw?.placeType ??
        detailRaw?.category ??
        summaryRaw?.tags?.type ??
        summaryRaw?.data?.tags?.type ??
        summaryRaw?.result?.tags?.type ??
        summaryRaw?.payload?.tags?.type ??
        summaryRaw?.type ??
        summaryRaw?.placeType ??
        summaryRaw?.category,
    ),
    getMoodLabel(
      detailRaw?.tags?.mood ??
        detailRaw?.data?.tags?.mood ??
        detailRaw?.result?.tags?.mood ??
        detailRaw?.payload?.tags?.mood ??
        detailRaw?.mood ??
        detailRaw?.placeMood ??
        summaryRaw?.tags?.mood ??
        summaryRaw?.data?.tags?.mood ??
        summaryRaw?.result?.tags?.mood ??
        summaryRaw?.payload?.tags?.mood ??
        summaryRaw?.mood ??
        summaryRaw?.placeMood,
    ),
  ].filter(Boolean);

  const detailTags = serverDetailTags.slice(0, 3);


  const hasAnyRealDetailContent = Boolean(
    detailModalAiSummary ||
    detailModalKeywords.length > 0 ||
    detailModalReviews.length > 0 ||
    hasFreshnessInfo,
  );

  return (
    <View style={styles.screen}>
      <Animated.View
        style={[
          styles.mapSection,
          {
            height: mapSectionHeight,
          },
        ]}
      >
        <Animated.View
          style={styles.mapLayer}
        >
          <MapView
            ref={mapRef}
          style={styles.map}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          initialRegion={INITIAL_REGION}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          scrollEnabled
          zoomEnabled
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {mapPlaces
            .filter(
              (place) =>
                typeof place.latitude === "number" &&
                typeof place.longitude === "number",
            )
            .map((place, index) => {
              const placeId = String(place.placeId);
              const isSelected = selectedPlaces.some(
                (selectedPlace) => String(selectedPlace.placeId) === placeId,
              );

              return (
                <Marker
                  key={`search-marker-${placeId}`}
                  coordinate={{
                    latitude: place.latitude as number,
                    longitude: place.longitude as number,
                  }}
                  title={place.name}
                  description={place.address}
                  tracksViewChanges={true}
                >
                  <View
                    style={[
                      styles.markerBadge,
                      isSelected && styles.selectedMarkerBadge,
                    ]}
                  >
                    <Text style={styles.markerBadgeText}>{index + 1}</Text>
                  </View>
                </Marker>
              );
            })}

          {focusedCoord ? (
            <Marker
              key="focused-place-marker"
              coordinate={focusedCoord}
              tracksViewChanges={false}
            />
          ) : null}
          </MapView>
        </Animated.View>

        <SafeAreaView
          pointerEvents="box-none"
          style={styles.searchOverlay}
        >
          <View style={styles.searchBar}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.75}
              onPress={handleBack}
              disabled={submitLoading}
            >
              <Ionicons name="chevron-back" size={25} color="#6F7F95" />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={keyword}
              onChangeText={setKeyword}
              placeholder="어디로 떠나시나요?"
              placeholderTextColor="#8090A6"
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleSubmitEditing}
            />

            <TouchableOpacity
              style={styles.searchButton}
              activeOpacity={0.75}
              onPress={handleSearch}
              disabled={searchLoading || submitLoading}
            >
              {searchLoading ?
                <ActivityIndicator size="small" color="#5D6E86" />
              : <Ionicons name="search" size={25} color="#5D6E86" />}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      <View style={styles.bottomSheet}>
        <View
          style={styles.handleTouchArea}
          {...bottomSheetPanResponder.panHandlers}
        >
          <TouchableOpacity
            style={styles.handleButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="장소 목록 펼치기 또는 접기"
            onPress={toggleBottomSheet}
          >
            <View style={styles.handleBar} />
          </TouchableOpacity>
        </View>

        <View style={styles.resultTabBar}>
          <TouchableOpacity
            style={[
              styles.resultTabButton,
              activeResultTab === "search" &&
                styles.resultTabButtonActive,
            ]}
            activeOpacity={0.8}
            onPress={() =>
              setActiveResultTab("search")
            }
          >
            <Text
              style={[
                styles.resultTabText,
                activeResultTab === "search" &&
                  styles.resultTabTextActive,
              ]}
            >
              검색 결과
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.resultTabButton,
              activeResultTab === "favorites" &&
                styles.resultTabButtonActive,
            ]}
            activeOpacity={0.8}
            onPress={() => {
              setActiveResultTab("favorites");
              void loadFavoritePlaces(true);
            }}
          >
            <Ionicons
              name={
                activeResultTab === "favorites"
                  ? "heart"
                  : "heart-outline"
              }
              size={17}
              color={
                activeResultTab === "favorites"
                  ? "#2F66F3"
                  : "#A8B3C3"
              }
            />

            <Text
              style={[
                styles.resultTabText,
                activeResultTab === "favorites" &&
                  styles.resultTabTextActive,
              ]}
            >
              즐겨찾기{favoriteListLoaded
                ? ` ${favoritePlaces.length}`
                : ""}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.resultScroll}
          contentContainerStyle={styles.resultContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeResultTab === "search" &&
          selectedPlaces.length > 0 ?
            <View style={styles.selectedSummaryBox}>
              <Text style={styles.selectedSummaryTitle}>
                선택한 장소 {selectedPlaces.length}개
              </Text>

              <Text style={styles.selectedSummaryText}>
                {selectedPlaces.map((place) => place.name).join(" · ")}
              </Text>
            </View>
          : null}

          {activeResultTab === "favorites" &&
          favoriteListLoading &&
          favoritePlaces.length === 0 ? (
            <View style={styles.favoriteEmptyCard}>
              <ActivityIndicator
                size="large"
                color="#2F66F3"
              />

              <Text style={styles.favoriteEmptyTitle}>
                즐겨찾기를 불러오는 중이에요
              </Text>
            </View>
          ) : null}

          {activeResultTab === "favorites" &&
          !favoriteListLoading &&
          favoritePlaces.length === 0 ? (
            <View style={styles.favoriteEmptyCard}>
              <View style={styles.favoriteEmptyIcon}>
                <Ionicons
                  name="heart-outline"
                  size={28}
                  color="#2F66F3"
                />
              </View>

              <Text style={styles.favoriteEmptyTitle}>
                저장한 장소가 아직 없어요
              </Text>

              <Text
                style={styles.favoriteEmptyDescription}
              >
                검색 결과의 하트를 눌러 가고 싶은
                장소를 모아보세요.
              </Text>

              <TouchableOpacity
                style={styles.favoriteEmptyButton}
                activeOpacity={0.8}
                onPress={() =>
                  setActiveResultTab("search")
                }
              >
                <Text
                  style={styles.favoriteEmptyButtonText}
                >
                  검색 결과 보기
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {placesToRender.map((place) => {
            const placeId = String(place.placeId);
            const reviewPlaceKey = getReviewPlaceKey(place);

            const isPreview = placeId === "empty-preview-1";
            const isSelected = selectedPlaces.some(
              (item) => item.placeId === placeId,
            );
            const isDetailLoading = detailLoadingPlaceId === placeId;
            const isReviewLoading =
              reviewLoadingPlaceId === reviewPlaceKey &&
              expandedPlaceId !== reviewPlaceKey;

            return (
              <SearchResultCard
                key={`place-${placeId}`}
                place={place}
                isPreview={isPreview}
                isSelected={isSelected}
                isDetailLoading={isDetailLoading}
                isReviewLoading={isReviewLoading}
                isFavorite={favoritePlaces.some(
                  (item) =>
                    getReviewPlaceKey(item) ===
                    reviewPlaceKey,
                )}
                isFavoriteLoading={
                  bookmarkActionPlaceId ===
                  reviewPlaceKey
                }
                onFavoritePress={
                  isPreview
                    ? undefined
                    : () => {
                        void toggleFavoritePlace(
                          place,
                        );
                      }
                }
                onCardPress={() =>
                  focusMapOnPlace(place)
                }
                onDetailPress={() => {
                  if (
                    typeof place.latitude === "number" &&
                    typeof place.longitude === "number"
                  ) {
                    mapRef.current?.animateToRegion(
                      {
                        latitude: place.latitude,
                        longitude: place.longitude,
                        latitudeDelta: 0.014,
                        longitudeDelta: 0.014,
                      },
                      350,
                    );
                  }

                  handleTogglePlaceReview(place);
                }}
                onSelectPress={() =>
                  handleNext([
                    {
                      ...place,
                      placeId: String(place.placeId),
                      googlePlaceId: String(
                        place.googlePlaceId ?? place.placeId,
                      ),
                      latitude: place.latitude ?? INITIAL_REGION.latitude,
                      longitude: place.longitude ?? INITIAL_REGION.longitude,
                    },
                  ])
                }
              />
            );
          })}
        </ScrollView>
      </View>

      <PlaceDetailBottomSheet
        visible={Boolean(detailModalPlace)}
        place={detailModalPlace}
        address={modalAddress}
        rating={modalRating}
        tags={detailTags}
        formattedOpeningHours={formattedOpeningHours}
        businessHoursExpanded={businessHoursExpanded}
        isLoading={
          reviewLoadingPlaceId === detailModalPlaceId && !detailModalReviewInfo
        }
        reanalyzeDisabled={reanalyzeLoadingPlaceId === detailModalPlaceId}
        aiSummary={detailModalAiSummary}
        reviews={detailModalReviews}
        hasAnyRealDetailContent={hasAnyRealDetailContent}
        onClose={() => setExpandedPlaceId(null)}
        onToggleBusinessHours={() =>
          setBusinessHoursExpanded((prev) => !prev)
        }
        onReanalyze={() => {
          if (detailModalPlace) {
            handleReanalyzePlace(detailModalPlace);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  mapSection: {
    backgroundColor: "#DDE7F2",
    position: "relative",
    overflow: "hidden",
    zIndex: 0,
  },

  mapLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  markerBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2158E8",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  markerBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  selectedMarkerBadge: {
    backgroundColor: "#EF4444",
    borderColor: "#FFFFFF",
    transform: [{ scale: 1.12 }],
  },

  searchOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 15,
  },

  searchBar: {
    height: 51,
    marginTop: 31,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#1E293B",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  backButton: {
    width: 43,
    height: 51,
    alignItems: "center",
    justifyContent: "center",
  },

  searchInput: {
    flex: 1,
    height: 44,
    paddingVertical: 0,
    textAlignVertical: "center",
    paddingTop: 1,
    color: "#263244",
    fontSize: 17,
    fontWeight: "700",
  },

  searchButton: {
    width: 50,
    height: 51,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomSheet: {
    flex: 1,
    marginTop: -4,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    position: "relative",
    zIndex: 2,
    elevation: 2,
  },

  handleTouchArea: {
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },

  handleButton: {
    width: 100,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  handleBar: {
    width: 43,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#D6DDE8",
  },

  resultTabBar: {
    height: 48,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 4,
    borderRadius: 12,
    backgroundColor: "#F7F9FC",
    borderWidth: 1,
    borderColor: "#E3E9F2",
    flexDirection: "row",
    gap: 6,
  },

  resultTabButton: {
    flex: 1,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  resultTabButtonActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E4F4",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },

  resultTabText: {
    color: "#A8B3C3",
    fontSize: 14,
    fontWeight: "800",
  },

  resultTabTextActive: {
    color: "#2F66F3",
  },

  resultScroll: {
    flex: 1,
  },

  resultContent: {
    flexGrow: 1,
    minHeight: 320,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  selectedSummaryBox: {
    borderRadius: 15,
    backgroundColor: "#EAF3FF",
    borderWidth: 1,
    borderColor: "#CFE3FF",
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 14,
  },

  selectedSummaryTitle: {
    color: "#2158E8",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 5,
  },

  selectedSummaryText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },

  favoriteEmptyCard: {
    minHeight: 245,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCE5F1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  favoriteEmptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  favoriteEmptyTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  favoriteEmptyDescription: {
    marginTop: 8,
    color: "#7C8CA3",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    textAlign: "center",
  },

  favoriteEmptyButton: {
    minWidth: 132,
    height: 40,
    marginTop: 18,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },

  favoriteEmptyButtonText: {
    color: "#2F66F3",
    fontSize: 13,
    fontWeight: "900",
  },








  detailTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 18,
  },

  detailTagPill: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  detailTagText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
  },












  disabledNextButton: {
    opacity: 0.75,
  },

  nextButton: {
    position: "absolute",
    right: 24,
    bottom: 120,
    width: 56,
    height: 44,
    borderRadius: 28,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 9999,
  },




























  keywordSection: {
    marginBottom: 12,
  },

  keywordWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  keywordChip: {
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  keywordChipText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
  },


















});
