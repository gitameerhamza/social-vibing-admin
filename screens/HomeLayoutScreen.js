import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SectionHeader from "../components/SectionHeader";
import { C } from "../components/Theme";
import { s } from "../styles/styles";

export default function HomeLayoutScreen() {
  const [tabs, setTabs] = React.useState(["Explore", "Posts", "Chats"]);

  // 🔹 Gradient Border Box (pics-style)
  const BorderRow = ({ title, colors, rightText }) => {
    const safeColors =
      Array.isArray(colors) && colors.length > 0
        ? colors
        : ["#3a3a3a", "#3a3a3a"];

    return (
      <View
        style={{
          marginHorizontal: 16,
          marginVertical: 6,
          borderRadius: 12,
          backgroundColor: C.card,
        }}
      >
        <LinearGradient
          colors={safeColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 12,
            padding: 1.5,
          }}
        >
          <View
            style={{
              backgroundColor: C.card,
              borderRadius: 12,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "600" }}>
              {title}
            </Text>
            {rightText ? (
              <Text
                style={{
                  color: C.accent,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {rightText}
              </Text>
            ) : null}
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <SectionHeader title="Circle Home Tab List" />

      {/* Tabs List */}
      {tabs.map((t, i) => (
        <BorderRow
          key={t + i}
          title={t}
          rightText={i === 0 ? "Start" : ""}
          colors={
            i === 0
              ? C.gradientPurple
              : i === 1
              ? C.gradientOrange
              : C.gradientBlue
          }
        />
      ))}

      {/* Add New Tab Button */}
      <View style={{ padding: 16 }}>
        <TouchableOpacity
          style={[
            s.addBox,
            {
              borderWidth: 1.5,
              borderColor: C.accent,
              backgroundColor: "transparent",
            },
          ]}
          onPress={() => setTabs((x) => [...x, `New Tab ${x.length + 1}`])}
        >
          <Text style={{ color: C.dim, fontWeight: "700" }}>＋ Add New Tab</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
