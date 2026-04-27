import React, { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  navigation: any;
  route?: {
    params?: {
      day?: number;
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
    };
  };
};

type RegionTab = "overseas" | "domestic";

type PlaceOption = {
  id: string;
  nameKo: string;
  nameEn: string;
  description: string;
  imageUrl: string;
  type: RegionTab;
};

const PLACE_OPTIONS: PlaceOption[] = [
  {
    id: "seoul-1",
    nameKo: "서울",
    nameEn: "Seoul",
    description: "남산타워, 청계천, 63빌딩",
    imageUrl:
      "https://images.unsplash.com/photo-1538485399081-7c8c9f92e8c6?q=80&w=400&auto=format&fit=crop",
    type: "domestic",
  },
  {
    id: "busan-1",
    nameKo: "부산",
    nameEn: "Busan",
    description: "해운대, 국제시장, 광안리",
    imageUrl:
      "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?q=80&w=400&auto=format&fit=crop",
    type: "domestic",
  },
  {
    id: "gangneung-1",
    nameKo: "강릉",
    nameEn: "Gangneung",
    description: "경포대, 김감자, 강릉역",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop",
    type: "domestic",
  },
  {
    id: "tokyo-1",
    nameKo: "도쿄",
    nameEn: "Tokyo",
    description: "시부야, 신주쿠, 도쿄타워",
    imageUrl:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=400&auto=format&fit=crop",
    type: "overseas",
  },
  {
    id: "paris-1",
    nameKo: "파리",
    nameEn: "Paris",
    description: "에펠탑, 루브르, 몽마르트",
    imageUrl:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=400&auto=format&fit=crop",
    type: "overseas",
  },
];

export default function AddPlaceScreen({ navigation, route }: Props) {
  const [activeTab, setActiveTab] = useState<RegionTab>("domestic");
  const [keyword, setKeyword] = useState("");

  const day = route?.params?.day ?? 1;

  const filteredPlaces = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return PLACE_OPTIONS.filter((place) => {
      const matchedTab = place.type === activeTab;

      if (!normalizedKeyword) {
        return matchedTab;
      }

      const matchedKeyword =
        place.nameKo.includes(keyword.trim()) ||
        place.nameEn.toLowerCase().includes(normalizedKeyword) ||
        place.description.toLowerCase().includes(normalizedKeyword);

      return matchedTab && matchedKeyword;
    });
  }, [activeTab, keyword]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSelectPlace = (place: PlaceOption) => {
    navigation.navigate("PlanA", {
      tripName: route?.params?.tripName,
      startDate: route?.params?.startDate,
      endDate: route?.params?.endDate,
      location: route?.params?.location,
      selectedPlace: {
        id: place.id,
        name: place.nameKo,
        time: "10:00",
        day,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.statusSpacer} />

          <View style={styles.searchRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.75}
            >
              <Ionicons name="chevron-back" size={22} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.searchBox}>
              <TextInput
                value={keyword}
                onChangeText={setKeyword}
                placeholder="어디로 떠나시나요? ✈️"
                placeholderTextColor="#9AA6B2"
                style={styles.searchInput}
              />

              <Ionicons name="search" size={20} color="#64748B" />
            </View>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={styles.tabButton}
              activeOpacity={0.8}
              onPress={() => setActiveTab("overseas")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "overseas" && styles.activeTabText,
                ]}
              >
                해외
              </Text>
              {activeTab === "overseas" ?
                <View style={styles.activeTabLine} />
              : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabButton}
              activeOpacity={0.8}
              onPress={() => setActiveTab("domestic")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "domestic" && styles.activeTabText,
                ]}
              >
                국내
              </Text>
              {activeTab === "domestic" ?
                <View style={styles.activeTabLine} />
              : null}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredPlaces.map((place) => (
            <View key={place.id} style={styles.placeRow}>
              <Image
                source={{ uri: place.imageUrl }}
                style={styles.placeImage}
              />

              <View style={styles.placeInfo}>
                <Text style={styles.placeTitle}>
                  {place.nameKo}, {place.nameEn}
                </Text>

                <Text style={styles.placeDescription} numberOfLines={1}>
                  {place.description}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.selectButton}
                activeOpacity={0.85}
                onPress={() => handleSelectPlace(place)}
              >
                <Text style={styles.selectButtonText}>선택</Text>
              </TouchableOpacity>
            </View>
          ))}

          {filteredPlaces.length === 0 ?
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={32} color="#8C9BB1" />
              <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
            </View>
          : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    paddingTop: 4,
    paddingHorizontal: 18,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },

  statusSpacer: {
    height: 10,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  backButton: {
    width: 34,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  searchBox: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCE7F7",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    height: "100%",
    paddingVertical: 0,
    paddingRight: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#1C2534",
  },

  tabRow: {
    flexDirection: "row",
    marginTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E7EF",
  },

  tabButton: {
    flex: 1,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  tabText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1C2534",
  },

  activeTabText: {
    color: "#2158E8",
  },

  activeTabLine: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -1,
    height: 2,
    backgroundColor: "#2158E8",
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },

  placeRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  placeImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E1E7EF",
    marginRight: 12,
  },

  placeInfo: {
    flex: 1,
    paddingRight: 10,
  },

  placeTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#252D3C",
  },

  placeDescription: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "600",
    color: "#8C9BB1",
  },

  selectButton: {
    width: 52,
    height: 40,
    borderRadius: 9,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },

  selectButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },

  emptyText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#8C9BB1",
  },
});
