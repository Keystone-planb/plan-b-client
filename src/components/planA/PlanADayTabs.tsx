import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
    <View style={styles.dayTabsWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayTabs}
      >
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
                style={[
                  styles.dayTabText,
                  isSelected && styles.activeDayTabText,
                ]}
              >
                {day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dayTabsWrapper: {
    marginTop: 14,
    height: 50,
  },

  dayTabs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 0,
    paddingRight: 12,
    height: 50,
  },

  dayTab: {
    minWidth: 82,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
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
    fontSize: 14,
    fontWeight: "800",
  },

  activeDayTabText: {
    color: "#FFFFFF",
  },
});
