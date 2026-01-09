import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { s } from "../styles/styles";
import { C } from "../components/Theme";
import { firebaseApp } from "../firebaseConfig";
import { getFirestore, collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export default function BlockedContentScreen({ navigation, route }) {
  const communityId = route?.params?.communityId;
  const communityName = route?.params?.communityName;
  
  const [blockedContent, setBlockedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBlockedContent();
  }, []);

  const fetchBlockedContent = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "blocked_content"),
        where("communityId", "==", communityId)
      );
      
      const querySnapshot = await getDocs(q);
      const content = [];
      
      querySnapshot.forEach((doc) => {
        content.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      setBlockedContent(content);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching blocked content:", error);
      Alert.alert("Error", "Failed to load blocked content");
      setLoading(false);
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      Alert.alert("Validation Error", "Please enter a keyword or phrase");
      return;
    }

    try {
      await addDoc(collection(db, "blocked_content"), {
        communityId: communityId,
        keyword: newKeyword.trim().toLowerCase(),
        type: "keyword",
        addedBy: auth.currentUser?.uid || "admin",
        addedAt: new Date().toISOString(),
        active: true,
      });

      Alert.alert("Success", "Blocked keyword added successfully");
      setNewKeyword("");
      setShowAddForm(false);
      fetchBlockedContent();
    } catch (error) {
      console.error("Error adding blocked content:", error);
      Alert.alert("Error", "Failed to add blocked keyword");
    }
  };

  const handleUnblock = async (contentId, keyword) => {
    Alert.alert(
      "Unblock Content",
      `Are you sure you want to unblock "${keyword}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "blocked_content", contentId));
              Alert.alert("Success", "Content unblocked successfully");
              fetchBlockedContent();
            } catch (error) {
              console.error("Error unblocking content:", error);
              Alert.alert("Error", "Failed to unblock content");
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (contentId, currentStatus) => {
    try {
      await updateDoc(doc(db, "blocked_content", contentId), {
        active: !currentStatus,
      });
      fetchBlockedContent();
    } catch (error) {
      console.error("Error updating content:", error);
      Alert.alert("Error", "Failed to update content status");
    }
  };

  const filteredContent = blockedContent.filter((item) =>
    item.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const BlockedCard = ({ item }) => (
    <View
      style={{
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 12,
        backgroundColor: C.card,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={item.active ? ["#E24A4A", "#C62828"] : ["#666", "#444"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 12,
          padding: 1.5,
        }}
      >
        <View style={{ backgroundColor: C.card, borderRadius: 12, padding: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: "700" }}>
                {item.keyword}
              </Text>
              <Text style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                Type: {item.type || "keyword"} • Added: {new Date(item.addedAt).toLocaleDateString()}
              </Text>
            </View>
            <Text
              style={{
                color: item.active ? "#4CAF50" : "#F44336",
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {item.active ? "● Active" : "○ Inactive"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 6 }}>
            <TouchableOpacity
              onPress={() => handleToggleActive(item.id, item.active)}
              style={{
                flex: 1,
                backgroundColor: item.active ? "#FFA726" : "#4CAF50",
                paddingVertical: 9,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                {item.active ? "Deactivate" : "Activate"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleUnblock(item.id, item.keyword)}
              style={{
                flex: 1,
                backgroundColor: "#D32F2F",
                paddingVertical: 9,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>Unblock</Text>
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
        <Text style={{ color: "#888", marginTop: 12 }}>Loading blocked content...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>🚫 Blocked Content</Text>
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
          {communityName || "Community"}
        </Text>
        <Text style={{ color: "#888", marginTop: 4 }}>
          Total Blocked: {blockedContent.length} | Active: {blockedContent.filter((c) => c.active).length}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search blocked keywords..."
          placeholderTextColor="#888"
          style={{
            backgroundColor: C.card,
            color: C.text,
            padding: 12,
            borderRadius: 10,
            fontSize: 15,
          }}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Add Button */}
        {!showAddForm && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setShowAddForm(true)}
              style={{
                backgroundColor: "#E24A4A",
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                ➕ Add Blocked Keyword
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
              Block New Keyword
            </Text>

            <Text style={{ color: "#888", marginBottom: 6 }}>Keyword or Phrase</Text>
            <TextInput
              value={newKeyword}
              onChangeText={setNewKeyword}
              placeholder="Enter word or phrase to block"
              placeholderTextColor="#666"
              style={{
                backgroundColor: "#2a2a2a",
                color: C.text,
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
              }}
            />

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddForm(false);
                  setNewKeyword("");
                }}
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
                onPress={handleAddKeyword}
                style={{
                  flex: 1,
                  backgroundColor: "#E24A4A",
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Add Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Blocked Content List */}
        {filteredContent.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: "#888", fontSize: 16 }}>
              {searchQuery ? "No blocked content found" : "No blocked content yet"}
            </Text>
            <Text style={{ color: "#666", fontSize: 13, marginTop: 8 }}>
              Add keywords or phrases to block from this community
            </Text>
          </View>
        ) : (
          filteredContent.map((item) => <BlockedCard key={item.id} item={item} />)
        )}
      </ScrollView>
    </View>
  );
}
