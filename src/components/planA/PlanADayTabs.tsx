import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { DayOption } from "../../types/planA";

type Props = {
  days: DayOption[];
  selectedDay: number;
  onChangeDay: (dayId: number) => void;
};

export default function PlanADayTabs({
  days,
  selectedDay,
  onChangeDay,
}: Props) {
  return (
    <View style={styles.dayTabs}>
      {days.map((day) => {
        const isSelected = selectedDay === day.id;

        return (
          <TouchableOpacity
            key={day.id}
            style={[styles.dayTab, isSelected && styles.activeDayTab]}
            activeOpacity={0.85}
            onPress={() => onChangeDay(day.id)}
          >
            <Text
              style={[styles.dayTabText, isSelected && styles.activeDayTabText]}
            >
              {day.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dayTabs: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },

  dayTab: {
    minWidth: 56,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "#F1F6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  activeDayTab: {
    backgroundColor: "#2158E8",
    shadowColor: "#2158E8",
    shadowOpacity: 0.24,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowRadius: 8,
    elevation: 4,
  },

  dayTabText: {
    color: "#8C9BB1",
    fontSize: 12,
    fontWeight: "800",
  },

  activeDayTabText: {
    color: "#FFFFFF",
  },
});
