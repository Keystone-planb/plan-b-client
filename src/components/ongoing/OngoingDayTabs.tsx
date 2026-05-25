import React from "react";
import { View, TouchableOpacity, Text } from "react-native";

type DayItem = {
  day: number;
};

type Props = {
  displayDays: DayItem[];
  selectedDayIndex: number;
  setSelectedDayIndex: (index: number) => void;
  styles: any;
};

export default function OngoingDayTabs({
  displayDays,
  selectedDayIndex,
  setSelectedDayIndex,
  styles,
}: Props) {
  return (
    <View style={styles.dayTabs}>
      {displayDays.map((day, index) => {
        const selected = selectedDayIndex === index;

        return (
          <TouchableOpacity
            key={`day-${day.day}`}
            style={[styles.dayTab, selected && styles.dayTabActive]}
            activeOpacity={0.85}
            onPress={() => setSelectedDayIndex(index)}
          >
            <Text
              style={[
                styles.dayTabText,
                selected && styles.dayTabTextActive,
              ]}
            >
              Day {day.day}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
