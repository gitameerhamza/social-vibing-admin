import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { s } from "../styles/styles";
import { C } from "../components/Theme";
import { Ionicons } from "@expo/vector-icons";
import SectionHeader from "../components/SectionHeader";

export default function SidebarLiteScreen() {
  // 🔹 Gradient Border Row (with icon)
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
        <Text style={s.headerTitle}>Amino Lite - Sidebar (S1)</Text>
      </View>

      {/* Main Section */}
      <SectionHeader title="Main" />
      {[
        "Community Guidelines",
        "My Chats",
        "Public Chatrooms",
        "Wikis",
        "See More…",
      ].map((x, i) => (
        <BorderRow
          key={x}
          label={x}
          colors={
            i === 0
              ? C.gradientPurple
              : i === 1
              ? C.gradientBlue
              : i === 2
              ? C.gradientOrange
              : i === 3
              ? C.gradientGreen
              : C.gradientPink
          }
        />
      ))}

      {/* Topics Section */}
      <SectionHeader title="Topics" />
      {["Featured", "Announcements", "Tutorials", "Food", "Health"].map(
        (x, i) => (
          <BorderRow
            key={x}
            label={x}
            colors={
              i === 0
                ? C.gradientMixed
                : i === 1
                ? C.gradientBlue
                : i === 2
                ? C.gradientPurple
                : i === 3
                ? C.gradientOrange
                : C.gradientGreen
            }
          />
        )
      )}

      {/* Options Section */}
      <SectionHeader title="Options" />
      {[
        "Members",
        "My Saved Posts",
        "Invite members",
        "Settings",
        "Guidelines",
        "About this community",
        "Logout",
      ].map((x, i) => (
        <BorderRow
          key={x}
          label={x}
          colors={
            i === 0
              ? C.gradientBlue
              : i === 1
              ? C.gradientOrange
              : i === 2
              ? C.gradientGreen
              : i === 3
              ? C.gradientPurple
              : i === 4
              ? C.gradientPink
              : i === 5
              ? C.gradientMixed
              : C.gradientRed
          }
        />
      ))}
    </ScrollView>
  );
}
