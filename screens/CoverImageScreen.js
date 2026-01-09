import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { s } from "../styles/styles";
import { C } from "../components/Theme";
import { firebaseApp } from "../firebaseConfig";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export default function CoverImageScreen({ navigation, route }) {
  const communityId = route?.params?.communityId;
  const communityName = route?.params?.communityName;
  
  const [currentImage, setCurrentImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrentImage();
  }, []);

  const loadCurrentImage = async () => {
    try {
      setLoading(true);
      const communityDoc = await getDoc(doc(db, "communities", communityId));
      if (communityDoc.exists()) {
        const data = communityDoc.data();
        setCurrentImage(data.backgroundImage || data.coverImage || null);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading image:", error);
      Alert.alert("Error", "Failed to load cover image");
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
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Camera permission is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!selectedImage) {
      Alert.alert("No Image", "Please select an image first");
      return;
    }

    Alert.alert(
      "Update Cover Image",
      "Are you sure you want to update the community cover image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: async () => {
            try {
              setSaving(true);
              
              // In a real app, you would upload to Firebase Storage
              // For now, we'll just update with the selected URI
              await updateDoc(doc(db, "communities", communityId), {
                backgroundImage: selectedImage,
                coverImage: selectedImage,
                updatedAt: new Date().toISOString(),
              });

              Alert.alert("Success", "Cover image updated successfully");
              setCurrentImage(selectedImage);
              setSelectedImage(null);
              setSaving(false);
            } catch (error) {
              console.error("Error updating image:", error);
              Alert.alert("Error", "Failed to update cover image");
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleRemove = () => {
    Alert.alert(
      "Remove Cover Image",
      "Are you sure you want to remove the cover image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);
              await updateDoc(doc(db, "communities", communityId), {
                backgroundImage: "",
                coverImage: "",
                updatedAt: new Date().toISOString(),
              });

              Alert.alert("Success", "Cover image removed");
              setCurrentImage(null);
              setSelectedImage(null);
              setSaving(false);
            } catch (error) {
              console.error("Error removing image:", error);
              Alert.alert("Error", "Failed to remove cover image");
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{ color: "#888", marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>🖼️ Cover Image</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Community Info */}
        <View
          style={{
            padding: 16,
            backgroundColor: C.card,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: C.text, fontSize: 16, fontWeight: "600" }}>
            {communityName || "Community"}
          </Text>
          <Text style={{ color: "#888", marginTop: 4 }}>
            Manage cover image for this community
          </Text>
        </View>

        {/* Current Image */}
        <Text style={{ color: C.text, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
          Current Cover Image
        </Text>
        {currentImage ? (
          <Image
            source={{ uri: currentImage }}
            style={{
              width: "100%",
              height: 200,
              borderRadius: 12,
              marginBottom: 20,
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: 200,
              borderRadius: 12,
              backgroundColor: "#2a2a2a",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ color: "#666", fontSize: 16 }}>No cover image set</Text>
          </View>
        )}

        {/* Selected Image Preview */}
        {selectedImage && (
          <>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
              New Cover Image (Preview)
            </Text>
            <Image
              source={{ uri: selectedImage }}
              style={{
                width: "100%",
                height: 200,
                borderRadius: 12,
                marginBottom: 20,
              }}
              resizeMode="cover"
            />
          </>
        )}

        {/* Action Buttons */}
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={pickImage}
            disabled={saving}
            style={{
              backgroundColor: "#4A90E2",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              📷 Choose from Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={takePicture}
            disabled={saving}
            style={{
              backgroundColor: "#9C27B0",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              📸 Take Photo
            </Text>
          </TouchableOpacity>

          {selectedImage && (
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{
                backgroundColor: "#4CAF50",
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                  ✓ Save New Image
                </Text>
              )}
            </TouchableOpacity>
          )}

          {currentImage && (
            <TouchableOpacity
              onPress={handleRemove}
              disabled={saving}
              style={{
                borderWidth: 1,
                borderColor: "#E24A4A",
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#E24A4A", fontSize: 16, fontWeight: "600" }}>
                🗑️ Remove Cover Image
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tips */}
        <View
          style={{
            marginTop: 24,
            padding: 16,
            backgroundColor: "#1a1a1a",
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#4A90E2", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
            💡 Tips
          </Text>
          <Text style={{ color: "#888", fontSize: 13, lineHeight: 20 }}>
            • Recommended size: 1920x1080 pixels (16:9 ratio){"\n"}
            • File size: Keep under 5MB for best performance{"\n"}
            • Format: JPG, PNG, or WebP{"\n"}
            • Avoid text in the image as it may be cut off on mobile
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
