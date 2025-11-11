import React from "react";
import { View, ScrollView, Text, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { s } from "../styles/styles";
import { C } from "../components/Theme";
import SectionHeader from "../components/SectionHeader";

export default function AdminPortalScreen({ navigation }) {
  const go = (screen) => navigation.navigate(screen);

  // 🔹 Border Gradient Row Component
  const BorderRow = ({ title, colors, onPress }) => {
    const safeColors =
      Array.isArray(colors) && colors.length > 0
        ? colors
        : ["#3a3a3a", "#3a3a3a"]; // fallback border

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{
          marginHorizontal: 16,
          marginVertical: 6,
          borderRadius: 12,
          backgroundColor: C.card,
        }}
      >
        {/* Gradient Border */}
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
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              {title}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Admin Portal</Text>
      </View>

      {/* Community Card */}
      <View style={s.communityCard}>
        <Image
          source={{ uri: "https://i.pravatar.cc/120?img=12" }}
          style={{ width: 56, height: 56, borderRadius: 12 }}
        />
        <View style={{ marginLeft: 12 }}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "700" }}>
            Magical Fantasy
          </Text>
          <Text style={s.dim}>Clover ID: c/MagicalFantasy</Text>
        </View>
      </View>

      {/* Scroll Section */}
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Top Shortcut */}
        <BorderRow title="Data Center" colors={C.gradientBlue} onPress={() => go("DataCenter")} />

        {/* Content Section */}
        <SectionHeader title="Content" />
        <BorderRow title="Cover Image" colors={C.gradientPurple} />
        <BorderRow title="Home Layout" colors={C.gradientOrange} onPress={() => go("HomeLayout")} />
        <BorderRow title="Community Folders" colors={C.gradientMixed} onPress={() => go("CommunityFolders")} />
        <BorderRow title="Community Rooms" colors={C.gradientBlue} onPress={() => go("CommunityRooms")} />
        <BorderRow title="Blocked Content" colors={C.gradientRed} />

        {/* Members Section */}
        <SectionHeader title="Members" />
        <BorderRow title="Community Members" colors={C.gradientBlue} />
        <BorderRow title="Community Titles" colors={C.gradientPurple} onPress={() => go("CommunityTitles")} />
        <BorderRow title="Community Members Page Layout" colors={C.gradientOrange} />
        <BorderRow title="Requests to Join" colors={C.gradientGreen} />
        <BorderRow title="Blocked Members" colors={C.gradientRed} />

        {/* Management Section */}
        <SectionHeader title="Management Team" />
        <BorderRow title="Manage Co-Admins" colors={C.gradientBlue} onPress={() => go("ManageCoAdmins")} />
        <BorderRow title="Transfer Admin" colors={C.gradientPink} />
        <BorderRow title="Management Operation Records" colors={C.gradientMixed} />

        {/* Delete Button */}
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: "#D14B4B",
              paddingVertical: 14,
              alignItems: "center",
              borderRadius: 12,
              backgroundColor: "transparent",
            }}
          >
            <Text style={{ color: "#FF6B6B", fontWeight: "700" }}>
              Delete this Community
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
