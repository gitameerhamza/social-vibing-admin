import React from "react";
import { View, Text } from "react-native";
import { s } from "../styles/styles";

export default function HomeScreen() {
  return (
    <View style={s.center}>
      <Text style={s.h1}>🏠 Community Home</Text>
      <Text style={s.dim}>Snack demo scaffold</Text>
    </View>
  );
}
