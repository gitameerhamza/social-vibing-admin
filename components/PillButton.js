import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { C } from "./Theme";

export default function PillButton({ title, onPress, outline }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: "center", backgroundColor: C.accent }, outline && { backgroundColor: "transparent", borderWidth: 1, borderColor: C.border }]}
    >
      <Text style={[{ color: "#000", fontWeight: "700" }, outline && { color: C.text, fontWeight: "600" }]}>{title}</Text>
    </TouchableOpacity>
  );
}
