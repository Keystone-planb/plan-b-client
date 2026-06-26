// src/components/planA/PlanAHeaderSection.tsx

import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import PlanADayTabs from "./PlanADayTabs";
import type { DayOption } from "../../types/planA";
import type { TravelSchedule } from "../../types/schedule";
import { formatTripDateRange } from "../../utils/planA/planAScreenUtils";

type Props = {
  schedule: TravelSchedule;
  isEditMode: boolean;
  saving: boolean;
  days: DayOption[];
  selectedDay: number;
  onBack: () => void;
  onUpdateTripName: (value: string) => void;
  onSaveEdit: () => void;
  onChangeDay: (dayId: number) => void;
};

export default function PlanAHeaderSection({
  schedule,
  isEditMode,
  saving,
  days,
  selectedDay,
  onBack,
  onUpdateTripName,
  onSaveEdit,
  onChangeDay,
}: Props) {
  return (
    <View style={styles.headerSection}>
      <View style={styles.topHeaderRow}>
        <TouchableOpacity
          style={styles.backButton}
          testID="plan-a-back-button"
          accessibilityLabel="Plan A back"
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={26} color="#64748B" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          {isEditMode ? (
            <TextInput
              style={styles.planTitleInput}
              value={schedule.tripName}
              onChangeText={onUpdateTripName}
              placeholder="일정 제목을 입력해주세요"
              placeholderTextColor="#94A3B8"
              maxLength={30}
              returnKeyType="done"
            />
          ) : (
            <Text style={styles.planTitle} numberOfLines={1}>
              {schedule.tripName}
            </Text>
          )}

          <Text style={styles.planDate}>
            {formatTripDateRange(schedule.startDate, schedule.endDate)}
          </Text>
        </View>

        <View style={styles.headerActionRow}>
          {isEditMode ? (
            <TouchableOpacity
              style={[
                styles.editModeButton,
                isEditMode && styles.editModeButtonActive,
                saving && styles.headerIconDisabled,
              ]}
              testID="plan-a-final-save-button"
              accessibilityLabel="Plan A final save"
              activeOpacity={0.8}
              disabled={saving}
              onPress={onSaveEdit}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={isEditMode ? "checkmark" : "create-outline"}
                  size={15}
                  color={isEditMode ? "#FFFFFF" : "#2158E8"}
                />
              )}

              <Text
                style={[
                  styles.editModeButtonText,
                  isEditMode && styles.editModeButtonTextActive,
                ]}
              >
                {saving ? "저장 중..." : isEditMode ? "완료" : "수정"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.dayTabsWrapper}>
        <PlanADayTabs
          days={days}
          selectedDay={selectedDay}
          onChangeDay={onChangeDay}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    backgroundColor: "#F8FBFF",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  topHeaderRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  backButton: {
    width: 32,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
    marginTop: 2,
  },
  headerInfo: { flex: 1, paddingLeft: 6, paddingRight: 8 },
  planTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 30,
  },
  planTitleInput: {
    minHeight: 34,
    paddingVertical: 0,
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 30,
  },
  planDate: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
  headerActionRow: {
    minWidth: 78,
    minHeight: 40,
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  editModeButton: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  editModeButtonActive: {
    backgroundColor: "#2158E8",
    borderColor: "#2158E8",
  },
  editModeButtonText: {
    color: "#2158E8",
    fontSize: 12,
    fontWeight: "900",
  },
  editModeButtonTextActive: {
    color: "#FFFFFF",
  },
  headerIconDisabled: { opacity: 0.55 },
  dayTabsWrapper: {
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "center",
    marginTop: 6,
  },
});
