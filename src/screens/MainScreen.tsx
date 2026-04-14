import React from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CalendarIcon from "../components/CalendarIcon";
import RadialBackground from "../components/RadialBackground";

type Props = {
  navigation: any;
};

export default function MainScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.logoText}>Plan.A</Text>
          <Text style={styles.subLogoText}>더 스마트한 여행의 시작</Text>
        </View>

        {/* 빈 상태 영역 */}
        <View style={styles.emptyStateContainer}>
          {/* 🔥 아이콘 + 텍스트 묶음 */}
          <View style={styles.iconArea}>
            <RadialBackground />

            <View style={styles.iconWrapper}>
              <CalendarIcon size={120} />
            </View>

            {/* ✅ 아이콘 바로 아래 텍스트 */}
            <View style={styles.textGroup}>
              <Text style={styles.mainText}>등록된 일정이 없습니다</Text>
              <Text style={styles.subText}>
                새로운 여행 일정을 추가해보세요
              </Text>
            </View>
          </View>

          {/* 버튼 */}
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("AddSchedule")}
          >
            <Text style={styles.addButtonText}>일정 추가하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },

  header: {
    position: "absolute",
    top: 60,
    alignItems: "center",
  },

  logoText: {
    fontSize: 52,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: -1.5,
  },

  subLogoText: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 4,
  },

  emptyStateContainer: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 40,
  },

  /* 🔥 핵심 영역 */
  iconArea: {
    width: 350,
    height: 240,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },

  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    transform: [{ translateY: -10 }], // ✅ 시각적 중앙 보정
  },

  textGroup: {
    alignItems: "center",
    marginTop: 12, // ✅ 아이콘 바로 아래
  },

  mainText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#252D3C",
    marginBottom: 8,
  },

  subText: {
    fontSize: 15,
    color: "#8C9BB1",
    textAlign: "center",
    lineHeight: 22,
  },

  addButton: {
    width: "40%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#2158E8",

    shadowColor: "#2158E8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },

  addButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
