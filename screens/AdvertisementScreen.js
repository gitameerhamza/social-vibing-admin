import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { s } from "../styles/styles";
import { C } from "../components/Theme";
import SectionHeader from "../components/SectionHeader";
import { firebaseApp } from "../firebaseConfig";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export default function AdvertisementScreen({ navigation, route }) {
  const communityId = route?.params?.communityId;
  
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [adLink, setAdLink] = useState("");
  const [adImage, setAdImage] = useState(null);
  const [adPosition, setAdPosition] = useState("top"); // top, middle, bottom

  useEffect(() => {
    authenticateAndFetch();
  }, [communityId]);

  const authenticateAndFetch = async () => {
    try {
      // Always try to authenticate first
      if (!auth.currentUser) {
        console.log("No user found, signing in anonymously...");
        const userCredential = await signInAnonymously(auth);
        console.log("Authenticated anonymously:", userCredential.user.uid);
      } else {
        console.log("Already authenticated:", auth.currentUser.uid);
      }
      
      // Small delay to ensure auth state is propagated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await fetchAdvertisements();
    } catch (error) {
      console.error("Authentication error:", error);
      Alert.alert("Authentication Error", "Failed to authenticate. Please restart the app.");
      setLoading(false);
    }
  };

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      console.log("Fetching advertisements...");
      
      try {
        const querySnapshot = await getDocs(collection(db, "advertisements"));
        console.log("Advertisements fetched:", querySnapshot.size);
        const adsData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Filter by community if communityId is provided
          if (!communityId || data.communityId === communityId) {
            adsData.push({
              id: doc.id,
              ...data,
            });
          }
        });
        console.log("Filtered advertisements:", adsData.length);
        setAdvertisements(adsData);
      } catch (fetchError) {
        console.log("Permission issue with advertisements collection. Collection might not exist yet or rules need update.");
        console.log("Error details:", fetchError.message);
        // Set empty array if permission denied - collection might not exist yet
        setAdvertisements([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      setAdvertisements([]);
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAdImage(result.assets[0].uri);
    }
  };

  const handleAddAdvertisement = async () => {
    if (!adTitle.trim()) {
      Alert.alert("Validation Error", "Please enter an advertisement title");
      return;
    }

    try {
      const newAd = {
        title: adTitle,
        description: adDescription,
        link: adLink,
        imageUrl: adImage || "https://via.placeholder.com/400x200",
        position: adPosition,
        communityId: communityId || "global",
        createdAt: new Date().toISOString(),
        active: true,
      };

      await addDoc(collection(db, "advertisements"), newAd);
      
      Alert.alert("Success", "Advertisement added successfully");
      
      // Reset form
      setAdTitle("");
      setAdDescription("");
      setAdLink("");
      setAdImage(null);
      setAdPosition("top");
      setShowAddForm(false);
      
      fetchAdvertisements();
    } catch (error) {
      console.error("Error adding advertisement:", error);
      Alert.alert("Error", "Failed to add advertisement");
    }
  };

  const handleDeleteAd = async (adId, adTitle) => {
    Alert.alert(
      "Delete Advertisement",
      `Are you sure you want to delete "${adTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "advertisements", adId));
              Alert.alert("Success", "Advertisement deleted successfully");
              fetchAdvertisements();
            } catch (error) {
              console.error("Error deleting advertisement:", error);
              Alert.alert("Error", "Failed to delete advertisement");
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (adId, currentStatus) => {
    try {
      await updateDoc(doc(db, "advertisements", adId), {
        active: !currentStatus,
      });
      fetchAdvertisements();
    } catch (error) {
      console.error("Error updating advertisement:", error);
      Alert.alert("Error", "Failed to update advertisement");
    }
  };

  const AdCard = ({ ad }) => (
    <View
      style={{
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        backgroundColor: C.card,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={ad.active ? C.gradientGreen : ["#555", "#333"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 12,
          padding: 1.5,
        }}
      >
        <View style={{ backgroundColor: C.card, borderRadius: 12, padding: 12 }}>
          {ad.imageUrl && (
            <Image
              source={{ uri: ad.imageUrl }}
              style={{ width: "100%", height: 120, borderRadius: 8, marginBottom: 10 }}
              resizeMode="cover"
            />
          )}
          
          <Text style={{ color: C.text, fontSize: 16, fontWeight: "700", marginBottom: 4 }}>
            {ad.title}
          </Text>
          
          {ad.description ? (
            <Text style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>
              {ad.description}
            </Text>
          ) : null}
          
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: "#666", fontSize: 12 }}>
              Position: {ad.position}
            </Text>
            <Text style={{ color: ad.active ? "#4CAF50" : "#F44336", fontSize: 12, fontWeight: "600" }}>
              {ad.active ? "● Active" : "○ Inactive"}
            </Text>
          </View>
          
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => handleToggleActive(ad.id, ad.active)}
              style={{
                flex: 1,
                backgroundColor: ad.active ? "#FFA726" : "#4CAF50",
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {ad.active ? "Deactivate" : "Activate"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleDeleteAd(ad.id, ad.title)}
              style={{
                flex: 1,
                backgroundColor: "#E24A4A",
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{ color: "#888", marginTop: 12 }}>Loading advertisements...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>📢 Advertisement Manager</Text>
      </View>

      {/* Stats */}
      <View
        style={{
          marginHorizontal: 16,
          marginVertical: 12,
          padding: 16,
          backgroundColor: C.card,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: C.text, fontSize: 16, fontWeight: "600" }}>
          Total Ads: {advertisements.length}
        </Text>
        <Text style={{ color: "#888", marginTop: 4 }}>
          Active: {advertisements.filter((ad) => ad.active).length} | 
          Inactive: {advertisements.filter((ad) => !ad.active).length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Add New Button */}
        {!showAddForm && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setShowAddForm(true)}
              style={{
                backgroundColor: "#4CAF50",
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                ➕ Add New Advertisement
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add Form */}
        {showAddForm && (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              padding: 16,
              backgroundColor: C.card,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "700", marginBottom: 16 }}>
              Create Advertisement
            </Text>

            <Text style={{ color: "#888", marginBottom: 6 }}>Title *</Text>
            <TextInput
              value={adTitle}
              onChangeText={setAdTitle}
              placeholder="Enter advertisement title"
              placeholderTextColor="#666"
              style={{
                backgroundColor: "#2a2a2a",
                color: C.text,
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
              }}
            />

            <Text style={{ color: "#888", marginBottom: 6 }}>Description</Text>
            <TextInput
              value={adDescription}
              onChangeText={setAdDescription}
              placeholder="Enter description (optional)"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: "#2a2a2a",
                color: C.text,
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
                textAlignVertical: "top",
              }}
            />

            <Text style={{ color: "#888", marginBottom: 6 }}>Link/URL</Text>
            <TextInput
              value={adLink}
              onChangeText={setAdLink}
              placeholder="https://example.com"
              placeholderTextColor="#666"
              style={{
                backgroundColor: "#2a2a2a",
                color: C.text,
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
              }}
            />

            <Text style={{ color: "#888", marginBottom: 6 }}>Position</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {["top", "middle", "bottom"].map((pos) => (
                <TouchableOpacity
                  key={pos}
                  onPress={() => setAdPosition(pos)}
                  style={{
                    flex: 1,
                    backgroundColor: adPosition === pos ? "#4A90E2" : "#2a2a2a",
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", textTransform: "capitalize" }}>
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={pickImage}
              style={{
                backgroundColor: "#2a2a2a",
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ color: "#4A90E2" }}>
                {adImage ? "✓ Image Selected" : "📷 Select Image"}
              </Text>
            </TouchableOpacity>

            {adImage && (
              <Image
                source={{ uri: adImage }}
                style={{ width: "100%", height: 150, borderRadius: 8, marginBottom: 16 }}
                resizeMode="cover"
              />
            )}

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setShowAddForm(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#666",
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleAddAdvertisement}
                style={{
                  flex: 1,
                  backgroundColor: "#4CAF50",
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Advertisements List */}
        <SectionHeader title="All Advertisements" />
        
        {advertisements.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: "#888", fontSize: 16 }}>No advertisements yet</Text>
            <Text style={{ color: "#666", fontSize: 13, marginTop: 8 }}>
              Create your first ad to get started
            </Text>
          </View>
        ) : (
          advertisements.map((ad) => <AdCard key={ad.id} ad={ad} />)
        )}
      </ScrollView>
    </View>
  );
}
