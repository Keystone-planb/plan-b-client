import React from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  children?: React.ReactNode;
  isExpanded?: boolean;
  isSelected?: boolean;
};

export default function RecommendationResultPlaceCard({
  children,
  isExpanded = false,
  isSelected = false,
}: Props) {
  return (
    <View
      style={[
        styles.placeCard,
        isExpanded && styles.expandedPlaceCard,
        isSelected && styles.selectedCard,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  placeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#DCE5F2",
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },

  expandedPlaceCard: {
    paddingBottom: 22,
    borderRadius: 22,
    borderColor: "#BFD7FF",
  },

  selectedCard: {
    borderColor: "#2158E8",
    backgroundColor: "#F8FBFF",
  },
});
