import React from "react";
import { ScrollView, View, Text, Image } from "react-native";
import { C } from "../components/Theme";
import { s } from "../styles/styles";

const Stat = ({ label }) => (
  <View style={s.statCard}>
    <Text style={{ color: C.text, fontSize: 28, fontWeight: "800", textAlign: "center" }}>0</Text>
    <Text style={[s.dim, { textAlign: "center", marginTop: 6 }]}>{label}</Text>
  </View>
);

export default function DataCenterScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.card }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
        <Image source={{ uri: "https://i.pravatar.cc/120?img=12" }} style={{ width: 52, height: 52, borderRadius: 12 }} />
        <View>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "700" }}>Magical Fantasy</Text>
          <Text style={s.dim}>c/MagicalFantasy</Text>
        </View>
      </View>

      <Text style={{ color: C.text, fontSize: 18, marginHorizontal: 16, marginBottom: 8 }}>Member Stats</Text>
      <View style={s.grid2}>
        <Stat label="Daily New Members" />
        <Stat label="Daily Active Members" />
        <Stat label="Daily Visitors" />
        <Stat label="Total Members" />
      </View>

      <Text style={{ color: C.text, fontSize: 18, marginHorizontal: 16, marginVertical: 8 }}>Content Stats</Text>
      <View style={s.grid2}>
        <Stat label="Daily New Posts" />
        <Stat label="Total Posts" />
        <Stat label="Daily New Chats" />
        <Stat label="Total Chats" />
      </View>
    </ScrollView>
  );
}
