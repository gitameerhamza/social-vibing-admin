import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "./Theme";

export default function ListRow({ title, rightImage, onPress, rightText }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.card, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ color: C.text, fontSize: 16 }}>{title}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {rightText ? <Text style={{ color: C.dim }}>{rightText}</Text> : null}
        {rightImage ? <View style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: "#20242b" }} /> : null}
        <Ionicons name="chevron-forward" size={18} color={C.dim} />
      </View>
    </TouchableOpacity>
  );
}
