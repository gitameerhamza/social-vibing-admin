import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { s } from "../styles/styles";
import { C } from "../components/Theme";
import { Ionicons } from "@expo/vector-icons";

export default function ManageCoAdminsScreen() {
  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ color: "#EAEAF0", fontSize: 22, fontWeight: "800", marginBottom: 12 }}>Manage Co-Admins</Text>
      <Text style={s.dim}>
        Co-Admins have the following permissions:{"\n"}
        - Edit Community description, cover image, background, theme color, tags etc.{"\n"}
        - Manage Community members{"\n"}
        - Manage Community content{"\n\n"}
        *A Community may only have 20 Co-Admins
      </Text>
      <View style={{ height: 24 }} />
      <TouchableOpacity style={s.addCircle}><Ionicons name="add" size={28} color={C.dim} /></TouchableOpacity>
    </ScrollView>
  );
}
