import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  tags: string[];
};

export default function RecommendationTagRow({ tags }: Props) {
  const visibleTags = tags.filter(Boolean).slice(0, 3);

  if (visibleTags.length <= 0) return null;

  return (
    <View style={styles.tagRow}>
      {visibleTags.map((tag) => (
        <View key={tag} style={styles.categoryPill}>
          <Text style={styles.categoryText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
    marginBottom: 0,
    marginLeft: 102,
    alignItems: "center",
  },

  categoryPill: {
    borderRadius: 8,
    backgroundColor: "#F3F6FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  categoryText: {
    color: "#7C8CA3",
    fontSize: 11,
    fontWeight: "800",
  },
});
