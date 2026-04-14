// src/components/OtpInput.tsx
import React, { useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  isVerified: boolean;
  isExpired: boolean;
}

export default function OtpInput({
  value,
  onChange,
  isVerified,
  isExpired,
}: OtpInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newValue = value.split("");
    newValue[index] = text;
    const joined = newValue.join("").slice(0, 6);
    onChange(joined);
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: 6 }).map((_, i) => (
        <TextInput
          key={i}
          ref={(ref) => {
            inputRefs.current[i] = ref;
          }}
          style={[
            styles.box,
            value[i] && styles.boxFilled,
            isVerified && styles.boxVerified,
            isExpired && styles.boxExpired,
          ]}
          value={value[i] || ""}
          onChangeText={(text) => handleChange(text.slice(-1), i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          editable={!isVerified && !isExpired}
          textAlign="center"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 8,
  },
  box: {
    width: 46,
    height: 56,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#FFF",
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
  },
  boxFilled: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  boxVerified: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
    color: "#16A34A",
  },
  boxExpired: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
});
