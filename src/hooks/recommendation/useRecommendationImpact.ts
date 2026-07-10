import { useEffect, useRef, useState } from "react";

import {
  getAlternativeImpact,
  type AlternativeImpactResponse,
} from "../../../api/schedules/server";

import type {
  RecommendationTransportMode,
} from "../../components/recommendation/RecommendationTransportCard";

import {
  createRecommendationImpactCacheKey,
  getCachedRecommendationImpact,
  getRecommendationImpactMinutes,
  getRecommendationImpactNextTime,
  getRecommendationImpactPlanId,
  getRecommendationImpactTimeText,
  setCachedRecommendationImpact,
} from "../../utils/recommendation/recommendationImpactUtils";

type ImpactPlace = {
  id?: string | number;
  tripPlaceId?: string | number;
  serverTripPlaceId?: string | number;
  placeId?: string | number;
  googlePlaceId?: string;
  name?: string;
  latitude?: number;
  longitude?: number;
};

type Params = {
  pendingPlace?: ImpactPlace | null;

  routeParams: {
    currentPlanId?: string | number;
    tripPlaceId?: string | number;
    serverTripPlaceId?: string | number;
    transportMode?: RecommendationTransportMode;
  };

  targetPlace?: ImpactPlace | null;
  fallbackNextTime: string;

  showToast: (
    title: string,
    message?: string,
    type?: "success" | "error" | "info",
  ) => void;

  onChangePreviousTransportMode: (
    mode: RecommendationTransportMode,
  ) => void;

  onChangeNextTransportMode: (
    mode: RecommendationTransportMode,
  ) => void;
};

type GapImpactParams = {
  pendingPlace?: ImpactPlace | null;
  beforePlanId?: string | number;
  afterPlanId?: string | number;
  initialTransportMode?: RecommendationTransportMode;
  onChangePreviousTransportMode: (
    mode: RecommendationTransportMode,
  ) => void;
  onChangeNextTransportMode: (
    mode: RecommendationTransportMode,
  ) => void;
};

export function useRecommendationImpact({
  pendingPlace,
  routeParams,
  targetPlace,
  fallbackNextTime,
  showToast,
  onChangePreviousTransportMode,
  onChangeNextTransportMode,
}: Params) {
  const [impactResult, setImpactResult] =
    useState<AlternativeImpactResponse | null>(null);

  const [previousImpactMode, setPreviousImpactMode] =
    useState<RecommendationTransportMode>(
      routeParams.transportMode ?? "WALK",
    );

  const [nextImpactMode, setNextImpactMode] =
    useState<RecommendationTransportMode>(
      routeParams.transportMode ?? "WALK",
    );

  const [impactLoading, setImpactLoading] =
    useState(false);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const initialMode =
      routeParams.transportMode ?? "WALK";

    setPreviousImpactMode(initialMode);
    setNextImpactMode(initialMode);
  }, [routeParams.transportMode]);

  useEffect(() => {
    if (!pendingPlace) {
      requestIdRef.current += 1;
      setImpactResult(null);
      setImpactLoading(false);
      return;
    }

    const requestImpact = async () => {
      const tripPlaceId =
        getRecommendationImpactPlanId({
          params: routeParams,
          targetPlace,
        });

      const newPlaceId = String(
        pendingPlace.googlePlaceId ??
          pendingPlace.placeId ??
          "",
      );

      const latitude = Number(
        pendingPlace.latitude,
      );

      const longitude = Number(
        pendingPlace.longitude,
      );

      if (!tripPlaceId || !newPlaceId) {
        setImpactResult(null);
        return;
      }

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        setImpactResult(null);

        showToast(
          "이동시간 계산 불가",
          "추천 장소의 좌표 정보가 없습니다.",
          "error",
        );
        return;
      }

      const cacheKey =
        createRecommendationImpactCacheKey({
          tripPlaceId,
          newPlaceId,
          latitude,
          longitude,
        });

      const cachedResult =
        getCachedRecommendationImpact(cacheKey);

      if (cachedResult) {
        setImpactResult(cachedResult);

        const cachedInitialMode =
          cachedResult.travelInMode ??
          cachedResult.travelOutMode ??
          routeParams.transportMode ??
          "WALK";

        setPreviousImpactMode(cachedInitialMode);
        setNextImpactMode(cachedInitialMode);
        setImpactLoading(false);
        return;
      }

      const requestId =
        requestIdRef.current + 1;

      requestIdRef.current = requestId;

      try {
        setImpactLoading(true);

        const result =
          await getAlternativeImpact(
            tripPlaceId,
            {
              newPlaceId,
              newPlaceName:
                pendingPlace.name ?? "",
              newLatitude: latitude,
              newLongitude: longitude,
            },
          );

        if (
          requestId !== requestIdRef.current
        ) {
          return;
        }

        if (result.calcStatus === "NO_COORD") {
          setImpactResult(null);

          showToast(
            "이동시간 계산 불가",
            "추천 장소의 좌표 정보를 확인해주세요.",
            "error",
          );
          return;
        }

        setCachedRecommendationImpact(
          cacheKey,
          result,
        );

        
        setImpactResult(result);

        const initialMode =
          result.travelInMode ??
          result.travelOutMode ??
          routeParams.transportMode ??
          "WALK";

        setPreviousImpactMode(initialMode);
        setNextImpactMode(initialMode);
      } catch (error) {
        if (
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setImpactResult(null);

        showToast(
          "이동시간 조회 실패",
          error instanceof Error
            ? error.message
            : "이동시간을 계산하지 못했습니다.",
          "error",
        );
      } finally {
        if (
          requestId === requestIdRef.current
        ) {
          setImpactLoading(false);
        }
      }
    };

    const initialMode =
      routeParams.transportMode ?? "WALK";

    setPreviousImpactMode(initialMode);
    setNextImpactMode(initialMode);

    void requestImpact();
  }, [
    pendingPlace,
    routeParams.currentPlanId,
    routeParams.serverTripPlaceId,
    routeParams.transportMode,
    routeParams.tripPlaceId,
    targetPlace,
  ]);

  const changePreviousImpactMode = (
    mode: RecommendationTransportMode,
  ) => {
    setPreviousImpactMode(mode);
    onChangePreviousTransportMode(mode);
  };

  const changeNextImpactMode = (
    mode: RecommendationTransportMode,
  ) => {
    setNextImpactMode(mode);
    onChangeNextTransportMode(mode);
  };

  const previousMinutes =
    getRecommendationImpactMinutes(
      impactResult?.travelInOptions,
      previousImpactMode,
      {
        scheduleTimeValues: [
          impactResult?.prevPlace?.newVisitTime,
          impactResult?.prevPlace?.visitTime,
          impactResult?.prevPlace?.newEndTime,
          impactResult?.prevPlace?.endTime,
        ],
      },
    );

  const nextMinutes =
    getRecommendationImpactMinutes(
      impactResult?.travelOutOptions,
      nextImpactMode,
      {
        scheduleTimeValues: [
          impactResult?.nextPlace?.newVisitTime,
          impactResult?.nextPlace?.visitTime,
          impactResult?.nextPlace?.newEndTime,
          impactResult?.nextPlace?.endTime,
        ],
      },
    );

  const previousMoveTimeText =
    getRecommendationImpactTimeText({
      loading: impactLoading,
      hasResult: Boolean(impactResult),
      minutes: previousMinutes,
    });

  const nextMoveTimeText =
    getRecommendationImpactTimeText({
      loading: impactLoading,
      hasResult: Boolean(impactResult),
      minutes: nextMinutes,
    });

  const nextTime =
    getRecommendationImpactNextTime({
      impactResult,
      fallbackTime: fallbackNextTime,
    });

  const closeImpactPreview = () => {
    requestIdRef.current += 1;
    setImpactResult(null);
    setImpactLoading(false);
  };

  return {
    impactResult,
    impactLoading,
    previousImpactMode,
    nextImpactMode,
    previousMoveTimeText,
    nextMoveTimeText,
    nextTime,
    changePreviousImpactMode,
    changeNextImpactMode,
    closeImpactPreview,
  };
}

export function useGapRecommendationImpact({
  pendingPlace,
  beforePlanId,
  afterPlanId,
  initialTransportMode = "WALK",
  onChangePreviousTransportMode,
  onChangeNextTransportMode,
}: GapImpactParams) {
  const [previousImpactResult, setPreviousImpactResult] =
    useState<AlternativeImpactResponse | null>(null);
  const [nextImpactResult, setNextImpactResult] =
    useState<AlternativeImpactResponse | null>(null);
  const [previousImpactMode, setPreviousImpactMode] =
    useState<RecommendationTransportMode>(initialTransportMode);
  const [nextImpactMode, setNextImpactMode] =
    useState<RecommendationTransportMode>(initialTransportMode);
  const [impactLoading, setImpactLoading] =
    useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setPreviousImpactMode(initialTransportMode);
    setNextImpactMode(initialTransportMode);
  }, [initialTransportMode]);

  useEffect(() => {
    if (!pendingPlace) {
      requestIdRef.current += 1;
      setPreviousImpactResult(null);
      setNextImpactResult(null);
      setImpactLoading(false);
      return;
    }

    const newPlaceId = String(
      pendingPlace.googlePlaceId ??
        pendingPlace.placeId ??
        "",
    );

    const latitude = Number(
      pendingPlace.latitude,
    );

    const longitude = Number(
      pendingPlace.longitude,
    );

    if (
      !beforePlanId ||
      !afterPlanId ||
      !newPlaceId ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      requestIdRef.current += 1;
      setPreviousImpactResult(null);
      setNextImpactResult(null);
      setImpactLoading(false);
      return;
    }

    const requestId =
      requestIdRef.current + 1;

    requestIdRef.current = requestId;
    setImpactLoading(true);

    const requestImpactForPlan = async (
      tripPlaceId: string | number,
    ) => {
      const cacheKey =
        createRecommendationImpactCacheKey({
          tripPlaceId,
          newPlaceId,
          latitude,
          longitude,
        });

      const cachedResult =
        getCachedRecommendationImpact(cacheKey);

      if (cachedResult) {
        return cachedResult;
      }

      const result =
        await getAlternativeImpact(
          tripPlaceId,
          {
            newPlaceId,
            newPlaceName:
              pendingPlace.name ?? "",
            newLatitude: latitude,
            newLongitude: longitude,
          },
        );

      setCachedRecommendationImpact(
        cacheKey,
        result,
      );

      return result;
    };

    const requestBothImpacts = async () => {
      try {
        const [
          nextLegResult,
          previousLegResult,
        ] = await Promise.all([
          requestImpactForPlan(beforePlanId),
          requestImpactForPlan(afterPlanId),
        ]);

        if (
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setNextImpactResult(
          nextLegResult.calcStatus === "OK"
            ? nextLegResult
            : null,
        );
        setPreviousImpactResult(
          previousLegResult.calcStatus === "OK"
            ? previousLegResult
            : null,
        );
      } catch {
        if (
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setPreviousImpactResult(null);
        setNextImpactResult(null);
      } finally {
        if (
          requestId === requestIdRef.current
        ) {
          setImpactLoading(false);
        }
      }
    };

    void requestBothImpacts();
  }, [
    afterPlanId,
    beforePlanId,
    pendingPlace,
  ]);

  const changePreviousImpactMode = (
    mode: RecommendationTransportMode,
  ) => {
    setPreviousImpactMode(mode);
    onChangePreviousTransportMode(mode);
  };

  const changeNextImpactMode = (
    mode: RecommendationTransportMode,
  ) => {
    setNextImpactMode(mode);
    onChangeNextTransportMode(mode);
  };

  const previousMinutes =
    getRecommendationImpactMinutes(
      previousImpactResult?.travelInOptions,
      previousImpactMode,
      {
        scheduleTimeValues: [
          previousImpactResult?.prevPlace?.newVisitTime,
          previousImpactResult?.prevPlace?.visitTime,
          previousImpactResult?.prevPlace?.newEndTime,
          previousImpactResult?.prevPlace?.endTime,
        ],
      },
    );

  const nextMinutes =
    getRecommendationImpactMinutes(
      nextImpactResult?.travelOutOptions,
      nextImpactMode,
      {
        scheduleTimeValues: [
          nextImpactResult?.nextPlace?.newVisitTime,
          nextImpactResult?.nextPlace?.visitTime,
          nextImpactResult?.nextPlace?.newEndTime,
          nextImpactResult?.nextPlace?.endTime,
        ],
      },
    );

  const previousMoveTimeText =
    getRecommendationImpactTimeText({
      loading: impactLoading,
      hasResult: Boolean(previousImpactResult),
      minutes: previousMinutes,
    });

  const nextMoveTimeText =
    getRecommendationImpactTimeText({
      loading: impactLoading,
      hasResult: Boolean(nextImpactResult),
      minutes: nextMinutes,
    });

  const closeImpactPreview = () => {
    requestIdRef.current += 1;
    setPreviousImpactResult(null);
    setNextImpactResult(null);
    setImpactLoading(false);
  };

  return {
    impactLoading,
    previousImpactMode,
    nextImpactMode,
    previousMoveTimeText,
    nextMoveTimeText,
    changePreviousImpactMode,
    changeNextImpactMode,
    closeImpactPreview,
  };
}
