import React, { useState } from "react";
import {
  Alert,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import TravelDateRangeModal from "../components/TravelDateRangeModal";

type Props = {
  navigation: any;
  route: any;
};

export default function AddScheduleDateScreen({ navigation, route }: Props) {
  const tripName = route?.params?.tripName ?? "";
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleComplete = () => {
    if (!startDate || !endDate) {
      Alert.alert("알림", "여행 날짜를 선택해주세요.");
      return;
    }

    navigation.navigate("AddScheduleLocation", {
      tripName,
      startDate,
      endDate,
    });
  };

  const formatDate = (value: string) => value.replace(/-/g, ".");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={24} color="#1C2534" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Plan.A</Text>

          <View style={styles.iconPlaceholder} />
        </View>

        <View style={styles.centerSection}>
          <View style={[styles.illustrationWrapper, styles.calendarBg]}>
            <Text style={styles.illustrationEmoji}>📅</Text>
          </View>

          <Text style={styles.title}>여행 날짜를{"\n"}알려주세요</Text>

          <Text style={styles.description}>
            {tripName ?
              `"${tripName}" 여행은 언제 떠나시나요?`
            : "언제부터 언제까지 여행하시나요?"}
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>출발일</Text>
          <TouchableOpacity
            style={styles.dateField}
            activeOpacity={0.85}
            onPress={() => setCalendarVisible(true)}
          >
            <Text style={styles.dateText}>
              {startDate ? formatDate(startDate) : "0000.00.00"}
            </Text>
            <View style={styles.calendarButton}>
              <Ionicons name="calendar-outline" size={20} color="#2158E8" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>종료일</Text>
          <TouchableOpacity
            style={styles.dateField}
            activeOpacity={0.85}
            onPress={() => setCalendarVisible(true)}
          >
            <Text style={styles.dateText}>
              {endDate ? formatDate(endDate) : "0000.00.00"}
            </Text>
            <View style={styles.calendarButton}>
              <Ionicons name="calendar-outline" size={20} color="#2158E8" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSection}>
          <View style={styles.pagination}>
            <View style={styles.dot} />
            <View style={styles.activeDot} />
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleComplete}
            activeOpacity={0.85}
          >
            <Text style={styles.nextButtonText}>다음</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TravelDateRangeModal
        visible={calendarVisible}
        initialStartDate={startDate}
        initialEndDate={endDate}
        onClose={() => setCalendarVisible(false)}
        onApply={({ startDate: nextStartDate, endDate: nextEndDate }) => {
          setStartDate(nextStartDate);
          setEndDate(nextEndDate);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 18,
    paddingBottom: 36,
    paddingHorizontal: 21,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 56,
    paddingHorizontal: 4,
  },

  iconButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  iconPlaceholder: {
    width: 30,
    height: 30,
  },

  headerTitle: {
    color: "#1C2534",
    fontSize: 40,
    fontWeight: "900",
    textAlign: "center",
  },

  centerSection: {
    alignItems: "center",
    marginBottom: 40,
  },

  illustrationWrapper: {
    width: 214,
    height: 214,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowRadius: 15,
    elevation: 12,
  },

  calendarBg: {
    backgroundColor: "#FFEDD2",
  },

  illustrationEmoji: {
    fontSize: 80,
  },

  title: {
    color: "#000000",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 20,
  },

  description: {
    color: "#627187",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },

  fieldGroup: {
    marginBottom: 20,
  },

  fieldLabel: {
    color: "#252D3C",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },

  dateField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E1E7EF",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },

  dateText: {
    color: "#8C9BB1",
    fontSize: 16,
    fontWeight: "500",
  },

  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  footerSection: {
    marginTop: "auto",
  },

  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },

  activeDot: {
    width: 24,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#2158E8",
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E1E7EF",
    marginRight: 8,
  },

  nextButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2158E8",
    borderRadius: 14,
    minHeight: 56,
    shadowColor: "#2158E8",
    shadowOpacity: 0.3,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 10,
    elevation: 10,
  },

  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
