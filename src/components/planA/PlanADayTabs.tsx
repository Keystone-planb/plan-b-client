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
    marginTop: 18,
    height: 54,
  },

  dayTabs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 2,
    paddingRight: 20,
    height: 54,
  },

  dayTab: {
    minWidth: 92,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
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
    fontSize: 15,
    fontWeight: "800",
  },

  activeDayTabText: {
    color: "#FFFFFF",
  },
});
