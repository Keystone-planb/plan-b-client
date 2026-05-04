import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = {
  navigation: any;
  route?: {
    params?: {
      from?: "signup" | "social";
    };
  };
};

type AgreementKey = "service" | "privacy" | "marketing" | "location";

type AgreementItem = {
  key: AgreementKey;
  title: string;
  description: string;
  required: boolean;
};

const AGREEMENT_ITEMS: AgreementItem[] = [
  {
    key: "service",
    title: "서비스 이용약관 동의",
    description: "Plan.B 서비스 이용을 위한 기본 약관입니다.",
    required: true,
  },
  {
    key: "privacy",
    title: "개인정보 처리방침 동의",
    description: "회원 정보 수집 및 이용에 대한 안내입니다.",
    required: true,
  },
  {
    key: "marketing",
    title: "마케팅 수신 동의",
    description: "이벤트, 혜택, 여행 추천 소식을 받을 수 있어요.",
    required: false,
  },
  {
    key: "location",
    title: "위치 정보 이용 동의",
    description: "여행지 추천과 지도 기능 개선에 활용됩니다.",
    required: false,
  },
];

const TERMS_STORAGE_KEY = "terms_agreement";

export default function TermsAgreementScreen({ navigation, route }: Props) {
  const [agreements, setAgreements] = useState<Record<AgreementKey, boolean>>({
    service: false,
    privacy: false,
    marketing: false,
    location: false,
  });

  const isAllChecked = useMemo(() => {
    return AGREEMENT_ITEMS.every((item) => agreements[item.key]);
  }, [agreements]);

  const canContinue = agreements.service && agreements.privacy;

  const handleBack = () => {
    navigation.goBack();
  };

  const toggleAgreement = (key: AgreementKey) => {
    setAgreements((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleAll = () => {
    const nextValue = !isAllChecked;

    setAgreements({
      service: nextValue,
      privacy: nextValue,
      marketing: nextValue,
      location: nextValue,
    });
  };

  const handlePressDetail = (item: AgreementItem) => {
    Alert.alert(item.title, "약관 상세 내용 화면은 추후 연결 예정입니다.");
  };

  const handleComplete = async () => {
    if (!canContinue) {
      Alert.alert("알림", "필수 약관에 동의해주세요.");
      return;
    }

    try {
      await AsyncStorage.setItem(
        TERMS_STORAGE_KEY,
        JSON.stringify({
          service: agreements.service,
          privacy: agreements.privacy,
          marketing: agreements.marketing,
          location: agreements.location,
          agreedAt: new Date().toISOString(),
          from: route?.params?.from ?? "signup",
        }),
      );

      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (error) {
      Alert.alert("오류", "약관 동의 저장에 실패했습니다.");
    }
  };

  const renderCheckIcon = (checked: boolean) => {
    return (
      <View style={[styles.checkCircle, checked && styles.checkedCircle]}>
        {checked ?
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.8}
              onPress={handleBack}
            >
              <Ionicons name="chevron-back" size={24} color="#1E293B" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>약관 동의</Text>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>
              Plan.B 이용을 위해{"\n"}약관에 동의해주세요
            </Text>

            <Text style={styles.subtitle}>
              필수 약관에 동의해야 서비스를 이용할 수 있어요.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.allAgreementCard, isAllChecked && styles.activeCard]}
            activeOpacity={0.85}
            onPress={handleToggleAll}
          >
            <View style={styles.allAgreementLeft}>
              {renderCheckIcon(isAllChecked)}

              <View style={styles.allAgreementTextBox}>
                <Text style={styles.allAgreementTitle}>전체 동의</Text>
                <Text style={styles.allAgreementDescription}>
                  필수 및 선택 약관에 모두 동의합니다.
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.agreementList}>
            {AGREEMENT_ITEMS.map((item) => {
              const checked = agreements[item.key];

              return (
                <View
                  key={item.key}
                  style={[styles.agreementCard, checked && styles.activeCard]}
                >
                  <TouchableOpacity
                    style={styles.agreementMain}
                    activeOpacity={0.85}
                    onPress={() => toggleAgreement(item.key)}
                  >
                    {renderCheckIcon(checked)}

                    <View style={styles.agreementTextBox}>
                      <View style={styles.agreementTitleRow}>
                        <Text style={styles.agreementTitle}>{item.title}</Text>

                        <View
                          style={[
                            styles.badge,
                            item.required ?
                              styles.requiredBadge
                            : styles.optionalBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              item.required ?
                                styles.requiredBadgeText
                              : styles.optionalBadgeText,
                            ]}
                          >
                            {item.required ? "필수" : "선택"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.agreementDescription}>
                        {item.description}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailButton}
                    activeOpacity={0.75}
                    onPress={() => handlePressDetail(item)}
                  >
                    <Text style={styles.detailButtonText}>보기</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color="#8C9BB1"
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <View style={styles.noticeBox}>
            <Ionicons name="information-circle" size={18} color="#2158E8" />
            <Text style={styles.noticeText}>
              선택 약관은 동의하지 않아도 서비스 이용이 가능해요.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, !canContinue && styles.disabledButton]}
            activeOpacity={0.85}
            onPress={handleComplete}
            disabled={!canContinue}
          >
            <Text style={styles.nextButtonText}>동의하고 시작하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#1E293B",
  },

  headerSpacer: {
    width: 38,
  },

  titleSection: {
    marginTop: 26,
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    lineHeight: 38,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: -0.8,
  },

  subtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    color: "#64748B",
  },

  allAgreementCard: {
    minHeight: 84,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  activeCard: {
    borderColor: "#2158E8",
    backgroundColor: "#F4F8FF",
  },

  allAgreementLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  allAgreementTextBox: {
    flex: 1,
    marginLeft: 12,
  },

  allAgreementTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E293B",
  },

  allAgreementDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    color: "#64748B",
  },

  agreementList: {
    marginTop: 18,
    gap: 12,
  },

  agreementCard: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },

  agreementMain: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  checkedCircle: {
    borderColor: "#2158E8",
    backgroundColor: "#2158E8",
  },

  agreementTextBox: {
    flex: 1,
    marginLeft: 12,
  },

  agreementTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  agreementTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E293B",
  },

  agreementDescription: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    color: "#64748B",
  },

  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },

  requiredBadge: {
    backgroundColor: "#EAF3FF",
  },

  optionalBadge: {
    backgroundColor: "#F1F5F9",
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "900",
  },

  requiredBadgeText: {
    color: "#2158E8",
  },

  optionalBadgeText: {
    color: "#64748B",
  },

  detailButton: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  detailButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8C9BB1",
  },

  noticeBox: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: "#EAF3FF",
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  noticeText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: "#2158E8",
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: "#F7F9FB",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  nextButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 4,
  },

  disabledButton: {
    opacity: 0.45,
  },

  nextButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
