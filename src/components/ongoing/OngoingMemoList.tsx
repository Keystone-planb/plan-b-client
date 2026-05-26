import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type MemoLike = {
  id?: string | number;
  memoId?: string | number;
  text?: string;
  content?: string;
  memo?: string;
};

type Props = {
  memos?: MemoLike[];
  styles?: any;
};

const getMemoText = (memo: MemoLike) => {
  return String(memo.text ?? memo.content ?? memo.memo ?? "").trim();
};

export default function OngoingMemoList({ memos = [] }: Props) {
  const visibleMemos = memos
    .map((memo, index) => ({
      id: String(memo.id ?? memo.memoId ?? `memo-${index}`),
      text: getMemoText(memo),
    }))
    .filter((memo) => memo.text.length > 0);

  if (visibleMemos.length === 0) {
    return null;
  }

  return (
    <View style={localStyles.wrapper}>
      {visibleMemos.map((memo) => (
        <View key={memo.id} style={localStyles.memoBox}>
          <Ionicons
            name="chatbox-ellipses-outline"
            size={14}
            color="#94A3B8"
          />
          <Text style={localStyles.memoText} numberOfLines={2}>
            {memo.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

const localStyles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginTop: 14,
    gap: 6,
  },

  memoBox: {
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  memoText: {
    flex: 1,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
});
