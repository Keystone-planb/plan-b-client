import React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  children?: React.ReactNode;
};

export default function RecommendationPlaceList({ children }: Props) {
  return <View style={styles.resultList}>{children}</View>;
}

const styles = StyleSheet.create({
  resultList: {
    gap: 18,
  },
});
