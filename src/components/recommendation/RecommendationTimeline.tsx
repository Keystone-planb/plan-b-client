import React from "react";
import { StyleSheet, Text, View } from "react-native";
import RecommendationPlaceCard from "./RecommendationPlaceCard";
import RecommendationTransportCard, {
  type RecommendationTransportMode,
} from "./RecommendationTransportCard";

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
  transportMode: RecommendationTransportMode;
  previousTransportMode?: RecommendationTransportMode;
  nextTransportMode?: RecommendationTransportMode;
  moveTimeText?: string;
  onChangeTransportMode: (mode: RecommendationTransportMode) => void;
  onChangePreviousTransportMode?: (mode: RecommendationTransportMode) => void;
  onChangeNextTransportMode?: (mode: RecommendationTransportMode) => void;
  onPressTimeEdit: () => void;
};

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
  transportMode,
  previousTransportMode,
  nextTransportMode,
  moveTimeText,
  onChangeTransportMode,
  onChangePreviousTransportMode,
  onChangeNextTransportMode,
  onPressTimeEdit,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.rail}>
        <View style={styles.nodeA}>
          <Text style={styles.nodeText}>A</Text>
        </View>

        <View style={styles.nodeB}>
          <Text style={styles.nodeText}>B</Text>
        </View>

        <View style={styles.nodeC}>
          <Text style={styles.nodeText}>C</Text>
        </View>
      </View>

      <View style={styles.cards}>
        <RecommendationPlaceCard
          badgeText="기존 일정"
          timeText={previousTime}
          placeName={previousName}
          address={previousAddress}
          showTimeEdit
          onPressTimeEdit={onPressTimeEdit}
        />

        <RecommendationTransportCard
          value={previousTransportMode ?? transportMode}
          moveTimeText={moveTimeText}
          onChange={onChangePreviousTransportMode ?? onChangeTransportMode}
        />

        <RecommendationPlaceCard
          variant="alternative"
          badgeText="대안 일정"
          timeText={alternativeTime}
          placeName={alternativeName}
          address={alternativeAddress}
          originalPlaceName={originalPlaceName}
          showTimeEdit
          onPressTimeEdit={onPressTimeEdit}
        />

        <RecommendationTransportCard
          value={nextTransportMode ?? transportMode}
          moveTimeText={moveTimeText}
          isAlternative
          onChange={onChangeNextTransportMode ?? onChangeTransportMode}
        />

        <RecommendationPlaceCard
          badgeText="기존 일정"
          timeText={nextTime}
          placeName={nextName}
          address={nextAddress}
          showTimeEdit
          onPressTimeEdit={onPressTimeEdit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "stretch",
  },

  rail: {
    width: 34,
    alignItems: "center",
    position: "relative",
    marginRight: 10,
  },

  nodeA: {
    position: "absolute",
    top: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#475569",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  nodeB: {
    position: "absolute",
    top: 155,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  nodeC: {
    position: "absolute",
    bottom: 22,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#475569",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  nodeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  cards: {
    flex: 1,
    gap: 10,
  },
});
