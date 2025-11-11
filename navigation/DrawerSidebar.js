import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { C } from "../components/Theme";
import { s } from "../styles/styles";

export default function DrawerSidebar({ navigation }) {
  const Item = ({ icon, label, onPress }) => (
    <TouchableOpacity style={s.drawerItem} onPress={onPress}>
      {icon}
      <Text style={{ color: C.text, marginLeft: 14, fontSize: 16 }}>{label}</Text>
    </TouchableOpacity>
  );
  const goTab = (screen) => navigation.navigate("Stack", { screen: "MainTabs", params: { screen } });

  return (
    <DrawerContentScrollView style={{ backgroundColor: C.bg }}>
      <View style={{ alignItems: "center", paddingVertical: 20, borderBottomColor: C.border, borderBottomWidth: 1 }}>
        <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: "#20242b", marginBottom: 8 }} />
        <Text style={{ color: C.text, fontSize: 18, fontWeight: "600" }}>Social Vibing Admin</Text>
      </View>

      <Item icon={<Ionicons name="home-outline" size={22} color={C.accent} />} label="Home" onPress={() => goTab("Home")} />
      <Item icon={<Ionicons name="chatbubble-outline" size={22} color={C.accent} />} label="Messages" onPress={() => goTab("Messages")} />
      <Item icon={<MaterialIcons name="favorite-border" size={22} color={C.accent} />} label="Favourites" onPress={() => goTab("Favourites")} />

      <View style={s.sectionLabelWrap}><Text style={s.sectionLabel}>Community</Text></View>
      <Item icon={<Ionicons name="settings-outline" size={22} color={C.accent} />} label="Admin Portal" onPress={() => navigation.navigate("Stack", { screen: "AdminPortal" })} />
      <Item icon={<Ionicons name="chatbubbles-outline" size={22} color={C.accent} />} label="Public Rooms" onPress={() => navigation.navigate("Stack", { screen: "CommunityRooms" })} />
      <Item icon={<Ionicons name="color-palette-outline" size={22} color={C.accent} />} label="Appearance" onPress={() => navigation.navigate("Stack", { screen: "Appearance" })} />
      <Item icon={<Ionicons name="shield-checkmark-outline" size={22} color={C.accent} />} label="Permissions" onPress={() => navigation.navigate("Stack", { screen: "PermissionsPrivacy" })} />

      <View style={s.sectionLabelWrap}><Text style={s.sectionLabel}>Samples</Text></View>
      <Item icon={<Ionicons name="list-outline" size={22} color={C.accent} />} label="Sidebar (S1)" onPress={() => navigation.navigate("Stack", { screen: "S1" })} />
      <Item icon={<Ionicons name="list-circle-outline" size={22} color={C.accent} />} label="Sidebar (S2)" onPress={() => navigation.navigate("Stack", { screen: "S2" })} />
      <Item icon={<Ionicons name="add-circle-outline" size={22} color={C.accent} />} label="Create Community" onPress={() => navigation.navigate("Stack", { screen: "CreateCommunity" })} />
      <Item icon={<Ionicons name="speedometer-outline" size={22} color={C.accent} />} label="Data Center" onPress={() => navigation.navigate("Stack", { screen: "DataCenter" })} />
    </DrawerContentScrollView>
  );
}
