import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  tripName: string;
  startDate: string;
  endDate: string;
  location: string;
  onSave: (payload: {
    tripName: string;
    startDate: string;
    endDate: string;
    location: string;
  }) => void;
};

export default function PlanAScheduleInfoEditor({
  tripName,
  startDate,
  endDate,
  location,
  onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draftTripName, setDraftTripName] = useState(tripName);
  const [draftStartDate, setDraftStartDate] = useState(startDate);
  const [draftEndDate, setDraftEndDate] = useState(endDate);
  const [draftLocation, setDraftLocation] = useState(location);

  useEffect(() => {
    if (editing) return;

    setDraftTripName(tripName);
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
    setDraftLocation(location);
  }, [editing, tripName, startDate, endDate, location]);

  const handleStartEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setDraftTripName(tripName);
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
    setDraftLocation(location);
    setEditing(false);
  };

  const handleSave = () => {
    const nextTripName = draftTripName.trim();
    const nextStartDate = draftStartDate.trim();
    const nextEndDate = draftEndDate.trim();
    const nextLocation = draftLocation.trim();

    if (!nextTripName || !nextStartDate || !nextEndDate) {
      return;
    }

    onSave({
      tripName: nextTripName,
      startDate: nextStartDate,
      endDate: nextEndDate,
      location: nextLocation,
    });

    setEditing(false);
  };

  if (!editing) {
    return (
      <View style={styles.container}>
        <View style={styles.infoTextBox}>
          <Text style={styles.tripTitle}>{tripName}</Text>

          <Text style={styles.tripPeriod}>
            {startDate} - {endDate}
          </Text>

          {location ?
            <Text style={styles.tripLocation}>{location}</Text>
          : <Text style={styles.emptyLocation}>지역 미정</Text>}
        </View>

        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.85}
          onPress={handleStartEdit}
        >
          <Ionicons name="create-outline" size={14} color="#2158E8" />
          <Text style={styles.editButtonText}>수정</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.editorBox}>
      <Text style={styles.editorLabel}>여행명</Text>
      <TextInput
        value={draftTripName}
        onChangeText={setDraftTripName}
        placeholder="여행명을 입력하세요"
        placeholderTextColor="#8C9BB1"
        style={styles.input}
      />

      <Text style={styles.editorLabel}>시작일</Text>
      <TextInput
        value={draftStartDate}
        onChangeText={setDraftStartDate}
        placeholder="2026-04-28"
        placeholderTextColor="#8C9BB1"
        style={styles.input}
      />

      <Text style={styles.editorLabel}>종료일</Text>
      <TextInput
        value={draftEndDate}
        onChangeText={setDraftEndDate}
        placeholder="2026-04-30"
        placeholderTextColor="#8C9BB1"
        style={styles.input}
      />

      <Text style={styles.editorLabel}>지역</Text>
      <TextInput
        value={draftLocation}
        onChangeText={setDraftLocation}
        placeholder="강릉"
        placeholderTextColor="#8C9BB1"
        style={styles.input}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.saveEditButton}
          activeOpacity={0.85}
          onPress={handleSave}
        >
          <Text style={styles.saveEditButtonText}>수정 완료</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelEditButton}
          activeOpacity={0.85}
          onPress={handleCancel}
        >
          <Text style={styles.cancelEditButtonText}>취소</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  infoTextBox: {
    flex: 1,
  },

  tripTitle: {
    color: "#252D3C",
    fontSize: 18,
    fontWeight: "900",
  },

  tripPeriod: {
    marginTop: 6,
    color: "#8C9BB1",
    fontSize: 12,
    fontWeight: "600",
  },

  tripLocation: {
    marginTop: 4,
    color: "#2158E8",
    fontSize: 12,
    fontWeight: "800",
  },

  emptyLocation: {
    marginTop: 4,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
  },

  editButton: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: "#EAF3FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  editButtonText: {
    color: "#2158E8",
    fontSize: 11,
    fontWeight: "900",
  },

  editorBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#DCEBFF",
  },

  editorLabel: {
    marginBottom: 6,
    color: "#627187",
    fontSize: 11,
    fontWeight: "900",
  },

  input: {
    height: 38,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#9FC8FF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    color: "#1C2534",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },

  saveEditButton: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },

  saveEditButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  cancelEditButton: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelEditButtonText: {
    color: "#2158E8",
    fontSize: 12,
    fontWeight: "900",
  },
});
