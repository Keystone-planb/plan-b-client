import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  summary?: string;
  isExpanded?: boolean;
};

export default function RecommendationAiSummaryBox({
  summary,
  isExpanded = false,
}: Props) {
  return (
    <View style={[styles.aiSummaryBox, isExpanded && styles.expandedAiSummaryBox]}>
      <Text style={styles.aiSummaryIcon}>📊</Text>

      <Text style={styles.aiSummaryText}>
        {summary || "AI 요약을 불러오는 중이에요."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  aiSummaryBox: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  expandedAiSummaryBox: {
    marginTop: 12,
  },

  aiSummaryIcon: {
    fontSize: 16,
    marginRight: 7,
    marginTop: 1,
  },

  aiSummaryText: {
    flex: 1,
    color: "#2158E8",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
  },
});
