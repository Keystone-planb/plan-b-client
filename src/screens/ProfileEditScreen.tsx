import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  navigation: any;
};

type ProfileRowProps = {
  label: string;
  value: string;
  onPress?: () => void;
};

function ProfileRow({ label, value, onPress }: ProfileRowProps) {
  return (
    <TouchableOpacity
      style={styles.infoRow}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <Text style={styles.infoLabel}>{label}</Text>

      <View style={styles.infoValueBox}>
        <Text style={styles.infoValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={17} color="#C7D0DE" />
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileEditScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.75}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#637083" />
          </TouchableOpacity>

          <Text style={styles.logo}>Plan.B</Text>

          <View style={styles.headerRightSpace} />
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={42} color="#FFFFFF" />
          </View>

          <TouchableOpacity style={styles.plusButton} activeOpacity={0.8}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <ProfileRow label="이름" value="김플랜" />
          <ProfileRow label="이메일" value="traveler@planb.com" />
          <ProfileRow label="휴대폰 번호" value="010-0000-0000" />
          <ProfileRow label="생년월일" value="0000.00.00" />
          <ProfileRow label="성별" value="비공개" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 12,
  },
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  logo: {
    fontSize: 31,
    fontWeight: "900",
    color: "#202938",
  },
  headerRightSpace: {
    width: 36,
    height: 36,
  },
  avatarSection: {
    marginTop: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
    backgroundColor: "#273142",
  },
  plusButton: {
    position: "absolute",
    right: "38%",
    bottom: 2,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#8797AD",
    borderWidth: 2,
    borderColor: "#F7F9FC",
  },
  infoSection: {
    marginTop: 48,
  },
  infoRow: {
    height: 47,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#202938",
  },
  infoValueBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoValue: {
    marginRight: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
});
