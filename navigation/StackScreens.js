// navigation/StackScreens.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { C } from "../components/Theme";

import HomeScreen from "../screens/HomeScreen";
import MessagesScreen from "../screens/MessageScreen";
import FavouritesScreen from "../screens/FavouritesScreen";

import AdminPortalScreen from "../screens/AdminPortalScreen";
import DataCenterScreen from "../screens/DataCenterScreen";
import CommunityInfoDetailScreen from "../screens/CommunityInfoDetailScreen";
import HomeLayoutScreen from "../screens/HomeLayoutScreen";
import CommunityFoldersScreen from "../screens/CommunityFoldersScreen";
import CommunityRoomsScreen from "../screens/CommunityRoomsScreen";
import PublicRoomDetail from "../screens/PublicRoomDetailScreen";
import PermissionsPrivacyScreen from "../screens/PermissionsPrivacyScreen";
import CommunityTitlesScreen from "../screens/CommunityTitlesScreen";
import ManageCoAdminsScreen from "../screens/ManageCoAdminsScreen";
import AppearanceScreen from "../screens/AppearanceScreen";
import ColorPickerScreen from "../screens/ColourPickerScreen";

import SidebarLiteScreen from "../screens/SideBarLite";
import SidebarOptionsScreen from "../screens/SideBarOptionScreen";

// ✅ Make the import name match what you register below
import CreateCommunityScreen from "../screens/CreateCommunityScreen";
import AdvertisementScreen from "../screens/AdvertisementScreen";
import CommunityMembersScreen from "../screens/CommunityMembersScreen";
import CoverImageScreen from "../screens/CoverImageScreen";
import BlockedContentScreen from "../screens/BlockedContentScreen";
import JoinRequestsScreen from "../screens/JoinRequestsScreen";
import BlockedMembersScreen from "../screens/BlockedMembersScreen";
import TransferAdminScreen from "../screens/TransferAdminScreen";
import ManagementRecordsScreen from "../screens/ManagementRecordsScreen";
import VerifyUsersScreen from "../screens/VerifyUsersScreen";
import ReportsDashboardScreen from "../screens/ReportsDashboardScreen";
import ReportDetailScreen from "../screens/ReportDetailScreen";

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: C.bg, borderTopColor: C.border },
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.dim,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Favourites"
        component={FavouritesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="favorite-border" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const Stack = createNativeStackNavigator();

export default function StackScreens() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.bg },
        headerTintColor: C.accent,
        contentStyle: { backgroundColor: C.card },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />

      {/* Admin / Settings */}
      <Stack.Screen name="AdminPortal" component={AdminPortalScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VerifyUsers" component={VerifyUsersScreen} options={{ title: "Verify Users" }} />
      <Stack.Screen name="DataCenter" component={DataCenterScreen} options={{ title: "Data Center" }} />
      <Stack.Screen name="PermissionsPrivacy" component={PermissionsPrivacyScreen} options={{ title: "Permissions & Privacy" }} />
      <Stack.Screen name="Appearance" component={AppearanceScreen} options={{ title: "Appearance" }} />
      <Stack.Screen name="ColorPicker" component={ColorPickerScreen} options={{ title: "Color Picker" }} />

      {/* Community */}
      <Stack.Screen name="CommunityInfoDetail" component={CommunityInfoDetailScreen} options={{ title: "Community Info" }} />
      <Stack.Screen name="HomeLayout" component={HomeLayoutScreen} options={{ title: "Home Layout" }} />
      <Stack.Screen name="CommunityFolders" component={CommunityFoldersScreen} options={{ title: "Community Folders" }} />
      <Stack.Screen name="CommunityRooms" component={CommunityRoomsScreen} options={{ title: "Public Rooms" }} />
      <Stack.Screen name="Room" component={PublicRoomDetail} options={{ title: "Room" }} />
      <Stack.Screen name="CommunityTitles" component={CommunityTitlesScreen} options={{ title: "Community Titles" }} />
      <Stack.Screen name="ManageCoAdmins" component={ManageCoAdminsScreen} options={{ title: "Manage Co-Admins" }} />

      {/* Samples */}
      <Stack.Screen name="S1" component={SidebarLiteScreen} options={{ title: "Sidebar (S1)" }} />
      <Stack.Screen name="S2" component={SidebarOptionsScreen} options={{ title: "Sidebar Options (S2)" }} />

      {/* ✅ Fixed: register the imported screen here */}
      <Stack.Screen
        name="CreateCommunity"
        component={CreateCommunityScreen}
        options={{ title: "Create Community" }}
      />
      <Stack.Screen
        name="Advertisement"
        component={AdvertisementScreen}
        options={{ title: "Advertisements" }}
      />
      <Stack.Screen
        name="CommunityMembers"
        component={CommunityMembersScreen}
        options={{ title: "Community Members" }}
      />
      <Stack.Screen
        name="CoverImage"
        component={CoverImageScreen}
        options={{ title: "Cover Image" }}
      />
      <Stack.Screen
        name="BlockedContent"
        component={BlockedContentScreen}
        options={{ title: "Blocked Content" }}
      />
      <Stack.Screen
        name="JoinRequests"
        component={JoinRequestsScreen}
        options={{ title: "Join Requests" }}
      />
      <Stack.Screen
        name="BlockedMembers"
        component={BlockedMembersScreen}
        options={{ title: "Blocked Members" }}
      />
      <Stack.Screen
        name="TransferAdmin"
        component={TransferAdminScreen}
        options={{ title: "Transfer Admin" }}
      />
      <Stack.Screen
        name="ManagementRecords"
        component={ManagementRecordsScreen}
        options={{ title: "Management Records" }}
      />
      <Stack.Screen
        name="ReportsDashboard"
        component={ReportsDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
