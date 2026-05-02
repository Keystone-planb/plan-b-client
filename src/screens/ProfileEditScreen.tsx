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
        <Ionicons name="chevron-forward" size={15} color="#C7D0DE" />
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileEditScreen({ navigation }: Props) {
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.75}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={23} color="#748195" />
          </TouchableOpacity>

          <Text style={styles.logo}>Plan.B</Text>

          <View style={styles.headerRightSpace} />
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={35} color="#FFFFFF" />
          </View>

          <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
            <Ionicons name="add" size={13} color="#273142" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <ProfileRow label="이름" value="김플랜" />
          <ProfileRow label="이메일" value="traveler@planb.com" />
          <ProfileRow label="휴대폰 번호" value="010-0000-0000" />
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
    backgroundColor: "#F7F9FC",
    paddingHorizontal: 21,
    paddingTop: 3,
  },

  header: {
    height: 57,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 32,
    height: 32,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  logo: {
    color: "#202938",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1,
  },

  headerRightSpace: {
    width: 32,
    height: 32,
  },

  avatarSection: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "#273142",
    alignItems: "center",
    justifyContent: "center",
  },

  addButton: {
    position: "absolute",
    left: "50%",
    bottom: 0,
    marginLeft: 16,
    width: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: "#B8C3D3",
    borderWidth: 2,
    borderColor: "#F7F9FC",
    alignItems: "center",
    justifyContent: "center",
  },

  infoSection: {
    marginTop: 48,
  },

  infoRow: {
    height: 41,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  infoLabel: {
    color: "#202938",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  infoValueBox: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoValue: {
    marginRight: 6,
    color: "#2F3A4A",
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
});
