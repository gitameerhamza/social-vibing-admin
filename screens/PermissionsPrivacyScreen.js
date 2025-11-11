import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { C } from "../components/Theme";
import { s } from "../styles/styles";

export default function PermissionsPrivacyScreen() {
  const [membership, setMembership] = React.useState("None");
  const [security, setSecurity] = React.useState("Open");
  const [discover, setDiscover] = React.useState("Public");

  const Drop = ({ title, value, onPress }) => (
    <TouchableOpacity onPress={onPress} style={s.drop}>
      <Text style={{ color: C.text, fontSize: 14, marginBottom: 4 }}>{title}</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: C.dim }}>{value}</Text>
        <Text style={{ color: C.dim }}>⌄</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.card, padding: 16 }}>
      <Text style={{ color: C.text, fontSize: 22, fontWeight: "800", marginBottom: 12 }}>Permissions & Privacy</Text>
      <Text style={{ color: C.text, fontSize: 18, marginBottom: 8 }}>Join Permissions</Text>
      <Drop title="Membership Card Requirement" value={membership === "None" ? "No Requirement (Default)" : membership} onPress={() => setMembership(membership === "None" ? "Required" : "None")} />
      <Drop title="Security Requirement" value={`${security} (Default)`} onPress={() => setSecurity(security === "Open" ? "Locked" : "Open")} />
      <View style={{ height: 16 }} />
      <Text style={{ color: C.text, fontSize: 18, marginBottom: 8 }}>Discoverability</Text>
      <Drop title="Listing" value={`${discover} (Default)`} onPress={() => setDiscover(discover === "Public" ? "Private" : "Public")} />
    </ScrollView>
  );
}
