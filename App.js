import * as React from "react";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import DrawerSidebar from "./navigation/DrawerSidebar";
import StackScreens from "./navigation/StackScreens";
import { C } from "./components/Theme";

const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => <DrawerSidebar {...props} />}
        screenOptions={{
          headerShown: true,
          drawerStyle: { backgroundColor: C.bg, width: 260 },
          headerStyle: { backgroundColor: C.bg },
          headerTintColor: C.accent,
        }}
      >
        <Drawer.Screen name="Stack" component={StackScreens} options={{ title: "App" }} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
