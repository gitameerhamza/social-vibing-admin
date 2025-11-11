import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { s } from "../styles/styles";
import { C } from "../components/Theme";
import { Ionicons } from "@expo/vector-icons";
import SectionHeader from "../components/SectionHeader";

export default function SidebarOptionsScreen() {
  // 🔹 Reusable Gradient Border Row
  const BorderRow = ({ label, colors }) => {
    const safeColors =
      Array.isArray(colors) && colors.length > 0
        ? colors
        : ["#3a3a3a", "#3a3a3a"];

    return (
      <View
        style={{
          marginHorizontal: 16,
          marginVertical: 5,
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
          <TouchableOpacity
            activeOpacity={0.85}
            style={{
              backgroundColor: C.card,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "600" }}>
              {label}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={C.dim} />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Sidebar Options (S2)</Text>
      </View>

      {/* Section */}
      <SectionHeader title="General" />
      {[
        "Community Info",
        "Appearance",
        "Permissions",
        "Push Notification Tasks",
        "Data Center",
      ].map((x, i) => (
        <BorderRow
          key={x}
          label={x}
          colors={
            i === 0
              ? C.gradientPurple
              : i === 1
              ? C.gradientOrange
              : i === 2
              ? C.gradientBlue
              : i === 3
              ? C.gradientGreen
              : C.gradientRed
          }
        />
      ))}
    </ScrollView>
  );
}
