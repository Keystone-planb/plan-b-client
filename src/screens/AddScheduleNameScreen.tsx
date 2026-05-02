import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  navigation: any;
};

export default function AddScheduleNameScreen({ navigation }: Props) {
  const [tripName, setTripName] = useState("");

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    if (!tripName.trim()) {
      return;
    }

    navigation.navigate("AddScheduleDate", {
      tripName: tripName.trim(),
    });
  };

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
          <View style={styles.illustrationWrapper}>
            <Ionicons name="airplane" size={96} color="#2158E8" />
          </View>

          <Text style={styles.title}>여행의 이름을{"\n"}정해주세요</Text>

          <Text style={styles.description}>이 여행을 어떻게 부를까요?</Text>
        </View>

        <TextInput
          placeholder="신나는 제주도 여행"
          placeholderTextColor="#8C9BB1"
          value={tripName}
          onChangeText={setTripName}
          style={styles.input}
        />

        <View style={styles.footerSection}>
          <View style={styles.pagination}>
            <View style={styles.activeDot} />
            <View style={styles.dot} />
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextButtonText}>다음</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 72,
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
    marginBottom: 50,
  },

  illustrationWrapper: {
    width: 214,
    height: 214,
    borderRadius: 999,
    backgroundColor: "#D5EBFC",
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
  },

  input: {
    alignSelf: "stretch",
    backgroundColor: "#FFFFFF",
    borderColor: "#E1E7EF",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 17,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#1C2534",
    marginBottom: 48,
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
    marginRight: 8,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E1E7EF",
  },

  nextButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2158E8",
    borderRadius: 14,
    minHeight: 56,
    marginBottom: 12,
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
