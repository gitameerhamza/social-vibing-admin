import * as React from "react";
import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import DrawerSidebar from "./navigation/DrawerSidebar";
import StackScreens from "./navigation/StackScreens";
import { C } from "./components/Theme";
import { firebaseApp } from "./firebaseConfig";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const Drawer = createDrawerNavigator();
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await checkAdminStatus(user);
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const checkAdminStatus = async (user) => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      if (userData?.role === "admin" || userData?.isAdmin === true) {
        setIsAuthenticated(true);
        setIsAdmin(true);
        setCheckingAuth(false);
      } else {
        Alert.alert("Access Denied", "You don't have admin privileges.");
        await auth.signOut();
        setIsAuthenticated(false);
        setIsAdmin(false);
        setCheckingAuth(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      Alert.alert("Error", "Failed to verify admin status.");
      setCheckingAuth(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    try {
      setLoginLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Failed to login";
      if (error.code === "auth/user-not-found") errorMessage = "No user found with this email";
      else if (error.code === "auth/wrong-password") errorMessage = "Incorrect password";
      else if (error.code === "auth/invalid-email") errorMessage = "Invalid email address";
      else if (error.code === "auth/invalid-credential") errorMessage = "Invalid email or password";
      Alert.alert("Login Failed", errorMessage);
      setLoginLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <View style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🛡️</Text>
            <Text style={styles.loginTitle}>Admin Portal</Text>
          </View>
          <Text style={styles.loginSubtitle}>Social Vibing Administration</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={C.dim} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Admin Email"
              placeholderTextColor={C.dim}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={C.dim} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={C.dim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loginLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loginLoading}
          >
            {loginLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login to Dashboard</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.loginHint}>
            🔒 Secure admin access only
          </Text>
        </View>
      </View>
    );
  }

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
        <Drawer.Screen name="Stack" component={StackScreens} options={{ title: "Admin Dashboard" }} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.bg,
  },
  loadingText: {
    marginTop: 12,
    color: C.dim,
    fontSize: 16,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.bg,
    padding: 20,
  },
  loginCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 40,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: C.accent,
    textAlign: "center",
  },
  loginSubtitle: {
    fontSize: 16,
    color: C.dim,
    textAlign: "center",
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    color: C.text,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: C.bg,
    fontSize: 18,
    fontWeight: "bold",
  },
  loginHint: {
    fontSize: 13,
    color: C.dim,
    textAlign: "center",
    marginTop: 24,
  },
};
