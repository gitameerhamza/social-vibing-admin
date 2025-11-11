import React from "react";
import { View, Text } from "react-native";
import { C } from "./Theme";

export default function SectionHeader({ title }) {
  if (!title) return null;
  return (
    <View style={{ backgroundColor: C.card2, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
      <Text style={{ color: C.dim, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>{title}</Text>
    </View>
  );
}
