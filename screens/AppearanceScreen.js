import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C } from "../components/Theme";
import { s } from "../styles/styles";

export default function AppearanceScreen({ navigation, route }) {
  const [theme, setTheme] = React.useState(route.params?.savedColor || "#6068ff");

  // 🔹 Gradient border row (safe + reusable)
  const BorderRow = ({ title, rightText, onPress, colors }) => {
    const safeColors =
      Array.isArray(colors) && colors.length > 0
        ? colors
        : ["#3a3a3a", "#3a3a3a"];

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
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
              alignItems: "center",
              justifyContent: "space-between",
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
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Gradient border rows */}
      <BorderRow title="Background Image" colors={C.gradientPurple} onPress={() => {}} />
      <BorderRow title="Home Tab Background" colors={C.gradientOrange} onPress={() => {}} />
      <BorderRow title="Menu Background" colors={C.gradientBlue} onPress={() => {}} />
      <BorderRow
        title="Theme Color"
        colors={C.gradientGreen}
        rightText={theme}
        onPress={() => navigation.navigate("ColorPicker", { theme })}
      />

      {/* Preview Section */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={{ color: C.dim, marginBottom: 8 }}>Preview</Text>

        <View style={s.previewRow}>
          {/* Gradient preview boxes */}
          <LinearGradient
            colors={C.gradientMixed}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              height: 160,
              borderRadius: 16,
              padding: 2,
              marginRight: 8,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: C.card,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={s.dim}>Main View</Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={C.gradientPink}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              height: 160,
              borderRadius: 16,
              padding: 2,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: C.card,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={s.dim}>Menu View</Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    </ScrollView>
  );
}
