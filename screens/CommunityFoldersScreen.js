import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C } from "../components/Theme";
import { s } from "../styles/styles";

export default function CommunityFoldersScreen() {
  const items = [
    { label: "Explore" },
    { label: "Posts" },
    { label: "Chats" },
    { label: "Featured Posts", sub: "Discover Featured Posts Here!" },
    { label: "Popular Rooms", sub: "Discover Featured Rooms here" },
    { label: "Newbies", sub: "Find tutorials, instructions…" },
    { label: "Circle Events", sub: "Explore community events" },
    { label: "Support & Feedback", sub: "Share your feedback and get help" },
  ];

  // Gradient border wrapper (safe version)
  const BorderRow = ({ label, sub, colors }) => {
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
          <TouchableOpacity
            activeOpacity={0.85}
            style={{
              backgroundColor: C.card,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 16,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: "#20242b",
                marginRight: 12,
                borderWidth: 1,
                borderColor: C.border,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: "600" }}>
                {label}
              </Text>
              {sub ? (
                <Text
                  numberOfLines={1}
                  style={{ color: C.dim, fontSize: 13, marginTop: 2 }}
                >
                  {sub}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      {items.map((x, i) => (
        <BorderRow
          key={i}
          label={x.label}
          sub={x.sub}
          colors={
            i === 0
              ? C.gradientPurple
              : i === 1
              ? C.gradientOrange
              : i === 2
              ? C.gradientBlue
              : i === 3
              ? C.gradientGreen
              : i === 4
              ? C.gradientPink
              : i === 5
              ? C.gradientRed
              : i === 6
              ? C.gradientMixed
              : C.gradientOrange
          }
        />
      ))}

      {/* Add New Folder Button */}
      <View style={{ padding: 16 }}>
        <TouchableOpacity
          style={[
            s.addDashed,
            {
              borderWidth: 1.5,
              borderColor: C.accent,
              backgroundColor: "transparent",
            },
          ]}
        >
          <Text style={{ color: C.dim, fontWeight: "700" }}>＋ Add…</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
