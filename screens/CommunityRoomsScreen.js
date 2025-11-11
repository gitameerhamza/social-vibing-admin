import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { C } from "../components/Theme";
import { s } from "../styles/styles";
import { MOCK_ROOMS } from "../data/mock";

export default function CommunityRoomsScreen({ navigation }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.card }}>
      <Text style={{ color: C.text, fontSize: 18, margin: 16 }}>Public Chat Rooms</Text>
      {MOCK_ROOMS.map((r) => (
        <TouchableOpacity key={r.id} onPress={() => navigation.navigate("Room", { roomId: r.id })} style={s.roomRow}>
          <View>
            <Text style={{ color: C.text, fontSize: 16 }}>{r.title}</Text>
            <Text style={s.dim}>{r.desc}</Text>
          </View>
            <Text style={{ color: C.accent, fontWeight: "700" }}>{r.members}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
