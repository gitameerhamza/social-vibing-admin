import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C } from "../components/Theme";
import { s } from "../styles/styles";

export default function PublicRoomDetail({ route }) {
  const { roomId } = route.params || {};

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.bg,
        padding: 16,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Gradient Border Card */}
      <LinearGradient
        colors={C.gradientPurple}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 16,
          padding: 2,
          width: "100%",
          maxWidth: 400,
        }}
      >
        <View
          style={{
            backgroundColor: C.card,
            borderRadius: 14,
            padding: 20,
          }}
        >
          <Text
            style={{
              color: C.text,
              fontSize: 20,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            Room: {roomId}
          </Text>
          <Text style={[s.dim, { fontSize: 15 }]}>
            Room details here…
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
