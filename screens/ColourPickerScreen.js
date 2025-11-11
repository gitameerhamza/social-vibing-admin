import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { C } from "../components/Theme";
import { Ionicons } from "@expo/vector-icons";

export default function ColorPickerScreen({ route, navigation }) {
  const preset = ["#FFD54F", "#26C6DA", "#00E5FF", "#29B6F6", "#BA68C8", "#7E57C2"];
  const [hex, setHex] = React.useState(route.params?.theme || "#6068ff");

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate("Appearance", { savedColor: hex })} style={{ paddingHorizontal: 8 }}>
          <Ionicons name="checkmark" size={22} color={C.accent} />
        </TouchableOpacity>
      ),
      title: "Customize Color",
    });
  }, [hex]);

  const Box = ({ h }) => (
    <TouchableOpacity onPress={() => setHex(h)} style={{ width: 34, height: 34, borderRadius: 17, marginRight: 10, backgroundColor: h, borderWidth: 1, borderColor: "#333" }} />
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.card, padding: 16 }}>
      <View style={{ backgroundColor: "#1b1f27", borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 8, alignItems: "center", marginBottom: 12 }}>
        <Text style={{ color: C.text, fontSize: 16 }}>{hex}</Text>
      </View>
      <View style={{ height: 140, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: hex, marginBottom: 12 }} />
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        {preset.map((p) => <Box key={p} h={p} />)}
      </View>
      <Text style={{ color: C.dim }}>Tip: lightweight demo picker (presets).</Text>
    </ScrollView>
  );
}
