import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type MemoItem = {
  id?: string | number;
  text?: string;
};

type Props = {
  memos?: MemoItem[];
  styles: any;
};

export default function OngoingMemoList({ memos, styles }: Props) {
  if (!memos?.length) return null;

  return (
    <View style={styles.memoList}>
      {memos.map((memo, index) => (
        <View key={memo.id ?? `memo-${index}`} style={styles.memoCard}>
          <Ionicons name="reader-outline" size={17} color="#64748B" />
          <Text style={styles.memoText}>{memo.text}</Text>
        </View>
      ))}
    </View>
  );
}
