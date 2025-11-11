import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { s } from "../styles/styles";

export default function CommunityTitlesScreen() {
  const colors = ["#666","#1aa39c","#c44b78","#e0a400","#6f78ff"];
  const [titles, setTitles] = React.useState(["Admin", "Co-Admin", "Curator", "VIP", "Welcome Team"]);

  return (
    <ScrollView style={{ flex: 1 }}>
      <Text style={{ color: "#A2A8B3", textAlign: "center", marginVertical: 8 }}>Bestow Titles upon your Community members</Text>
      {titles.map((t, i) => (
        <View key={t + i} style={s.titleRow}>
          <View style={[s.badge, { backgroundColor: colors[i % colors.length] }]}><Text style={{ color: "#fff", fontWeight: "700" }}>{t}</Text></View>
          <Text style={{ color: "#A2A8B3" }}>⋯</Text>
        </View>
      ))}
      <View style={{ padding: 16 }}>
        <TouchableOpacity style={s.addDashed} onPress={() => setTitles((x) => [...x, `New Title ${x.length + 1}`])}>
          <Text style={{ color: "#A2A8B3", fontWeight: "700" }}>＋  Add New Title</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
