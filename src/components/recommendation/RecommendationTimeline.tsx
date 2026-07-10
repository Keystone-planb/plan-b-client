import React from "react";
import { StyleSheet, Text, View } from "react-native";

import RecommendationPlaceCard from "./RecommendationPlaceCard";
import RecommendationTransportCard, {
  type RecommendationTransportMode,
} from "./RecommendationTransportCard";
import {
  normalizeDisplayTime,
  normalizeDisplayTimeRange,
} from "../../utils/recommendation/recommendationFormatters";
import type {
  PreviewScheduleTimeTarget,
} from "../../hooks/recommendation/useRecommendationPreview";

type Props = {
  previousName: string;
  previousTime: string;
  previousAddress?: string;

  alternativeName: string;
  alternativeTime: string;
  alternativeAddress?: string;
  originalPlaceName: string;

  nextName: string;
  nextTime: string;
  nextAddress?: string;

  hasPreviousSchedule?: boolean;
  hasNextSchedule?: boolean;

  transportMode: RecommendationTransportMode;
  previousTransportMode?: RecommendationTransportMode;
  nextTransportMode?: RecommendationTransportMode;
  previousMoveTimeText?: string;
  nextMoveTimeText?: string;

  onChangeTransportMode: (
    mode: RecommendationTransportMode,
  ) => void;
  onChangePreviousTransportMode?: (
    mode: RecommendationTransportMode,
  ) => void;
  onChangeNextTransportMode?: (
    mode: RecommendationTransportMode,
  ) => void;
  onPressTimeEdit: (
    target: PreviewScheduleTimeTarget,
  ) => void;
};

const toMinutes = (value: string) => {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
};

const formatTimeRange = (value: string) => {
  const match = value.match(
    /^\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*$/,
  );

  if (!match) return normalizeDisplayTimeRange(value);

  const start = toMinutes(match[1]);
  const end = toMinutes(match[2]);

  if (start == null || end == null || end >= start) {
    return value;
  }

  return `${match[1]} - 익일 ${match[2]}`;
};

type TimelineNodeProps = {
  label: "A" | "B" | "C";
  active?: boolean;
  showTopLine?: boolean;
  showBottomLine?: boolean;
};

function TimelineNode({
  label,
  active = false,
  showTopLine = false,
  showBottomLine = false,
}: TimelineNodeProps) {
  return (
    <View style={styles.nodeColumn}>
      {showTopLine ? <View style={styles.nodeTopLine} /> : null}

      <View
        style={[
          styles.node,
          active ? styles.activeNode : styles.normalNode,
        ]}
      >
        <Text style={styles.nodeText}>{label}</Text>
      </View>

      {showBottomLine ? (
        <View style={styles.nodeBottomLine} />
      ) : null}
    </View>
  );
}

type EmptyScheduleRowProps = {
  type: "previous" | "next";
};

function EmptyScheduleRow({
  type,
}: EmptyScheduleRowProps) {
  const isPrevious = type === "previous";

  return (
    <View style={styles.emptyScheduleRow}>
      <Text style={styles.emptyScheduleTitle}>
        {isPrevious
          ? "이전 일정이 없습니다"
          : "다음 일정이 없습니다"}
      </Text>

      <Text style={styles.emptyScheduleDescription}>
        {isPrevious
          ? "이 일정이 첫 번째 일정이에요."
          : "이 일정 이후에 등록된 일정이 없어요."}
      </Text>
    </View>
  );
}

export default function RecommendationTimeline({
  previousName,
  previousTime,
  previousAddress,
  alternativeName,
  alternativeTime,
  alternativeAddress,
  originalPlaceName,
  nextName,
  nextTime,
  nextAddress,
  hasPreviousSchedule = true,
  hasNextSchedule = true,
  transportMode,
  previousTransportMode,
  nextTransportMode,
  previousMoveTimeText,
  nextMoveTimeText,
  onChangeTransportMode,
  onChangePreviousTransportMode,
  onChangeNextTransportMode,
  onPressTimeEdit,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.scheduleRow}>
        <TimelineNode
          label="A"
          showBottomLine
        />

        <View style={styles.content}>
          {hasPreviousSchedule ? (
            <RecommendationPlaceCard
              badgeText="이전 일정"
              timeText={formatTimeRange(previousTime)}
              placeName={previousName}
              address={previousAddress}
              showTimeEdit
              onPressTimeEdit={() =>
                onPressTimeEdit("previous")
              }
            />
          ) : (
            <EmptyScheduleRow type="previous" />
          )}
        </View>
      </View>

      {hasPreviousSchedule ? (
        <View style={styles.transportRow}>
          <View style={styles.transportRail}>
            <View style={styles.transportLine} />
          </View>

          <View style={styles.content}>
            <RecommendationTransportCard
              value={previousTransportMode ?? transportMode}
              moveTimeText={previousMoveTimeText}
              onChange={
                onChangePreviousTransportMode ??
                onChangeTransportMode
              }
            />
          </View>
        </View>
      ) : null}

      <View style={styles.scheduleRow}>
        <TimelineNode
          label="B"
          active
          showTopLine={hasPreviousSchedule}
          showBottomLine={hasNextSchedule}
        />

        <View style={styles.content}>
          <RecommendationPlaceCard
            variant="alternative"
            badgeText="대안 일정"
            timeText={formatTimeRange(alternativeTime)}
            placeName={alternativeName}
            address={alternativeAddress}
            originalPlaceName={originalPlaceName}
            showTimeEdit
            onPressTimeEdit={() =>
              onPressTimeEdit("alternative")
            }
          />
        </View>
      </View>

      {hasNextSchedule ? (
        <View style={styles.transportRow}>
          <View style={styles.transportRail}>
            <View style={styles.transportLine} />
          </View>

          <View style={styles.content}>
            <RecommendationTransportCard
              value={nextTransportMode ?? transportMode}
              moveTimeText={nextMoveTimeText}
              isAlternative
              onChange={
                onChangeNextTransportMode ??
                onChangeTransportMode
              }
            />
          </View>
        </View>
      ) : null}

      <View style={styles.scheduleRow}>
        <TimelineNode
          label="C"
          showTopLine={hasNextSchedule}
        />

        <View style={styles.content}>
          {hasNextSchedule ? (
            <RecommendationPlaceCard
              badgeText="이후 일정"
              timeText={formatTimeRange(nextTime)}
              placeName={nextName}
              address={nextAddress}
              showTimeEdit
              onPressTimeEdit={() =>
                onPressTimeEdit("next")
              }
            />
          ) : (
            <EmptyScheduleRow type="next" />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    gap: 8,
    minWidth: 0,
  },

  scheduleRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minWidth: 0,
  },

  transportRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minWidth: 0,
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  nodeColumn: {
    width: 40,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
  },

  node: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  normalNode: {
    backgroundColor: "#475569",
  },

  activeNode: {
    backgroundColor: "#2158E8",
  },

  nodeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  nodeTopLine: {
    position: "absolute",
    top: 0,
    bottom: "50%",
    width: 1.5,
    backgroundColor: "#D7E0EC",
  },

  nodeBottomLine: {
    position: "absolute",
    top: "50%",
    bottom: 0,
    width: 1.5,
    backgroundColor: "#D7E0EC",
  },

  transportRail: {
    width: 40,
    marginRight: 8,
    alignItems: "center",
    flexShrink: 0,
  },

  transportLine: {
    flex: 1,
    width: 1.5,
    minHeight: 52,
    backgroundColor: "#D7E0EC",
  },

  emptyScheduleRow: {
    minHeight: 78,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
  },

  emptyScheduleTitle: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "900",
  },

  emptyScheduleDescription: {
    marginTop: 6,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
});
