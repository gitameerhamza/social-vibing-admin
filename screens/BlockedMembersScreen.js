import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { s } from "../styles/styles";
import { C } from "../components/Theme";
import { firebaseApp } from "../firebaseConfig";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export default function BlockedMembersScreen({ navigation, route }) {
  const communityId = route?.params?.communityId;
  const communityName = route?.params?.communityName;
  
  const [blockedMembers, setBlockedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBlockedMembers();
  }, []);

  const fetchBlockedMembers = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "communities_members"),
        where("communityId", "==", communityId),
        where("blocked", "==", true)
      );
      
      const querySnapshot = await getDocs(q);
      const membersData = [];
      
      querySnapshot.forEach((doc) => {
        membersData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      setBlockedMembers(membersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching blocked members:", error);
      Alert.alert("Error", "Failed to load blocked members");
      setLoading(false);
    }
  };

  const handleUnblock = async (memberId, memberName) => {
    Alert.alert(
      "Unblock Member",
      `Are you sure you want to unblock ${memberName || "this member"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "communities_members", memberId), {
                blocked: false,
                blockedAt: null,
                unblockedAt: new Date().toISOString(),
                unblockedBy: auth.currentUser?.uid || "admin",
              });

              Alert.alert("Success", "Member unblocked successfully");
              fetchBlockedMembers();
            } catch (error) {
              console.error("Error unblocking member:", error);
              Alert.alert("Error", "Failed to unblock member");
            }
          },
        },
      ]
    );
  };

  const handleRemove = async (memberId, memberName) => {
    Alert.alert(
      "Remove Member",
      `Permanently remove ${memberName || "this member"} from the community?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "communities_members", memberId));
              Alert.alert("Success", "Member removed from community");
              fetchBlockedMembers();
            } catch (error) {
              console.error("Error removing member:", error);
              Alert.alert("Error", "Failed to remove member");
            }
          },
        },
      ]
    );
  };

  const filteredMembers = blockedMembers.filter((member) => {
    const searchLower = searchQuery.toLowerCase();
    const userId = member.userId || member.id || "";
    return userId.toLowerCase().includes(searchLower);
  });

  const BlockedMemberCard = ({ member }) => {
    const userId = member.userId || member.id;
    const blockedDate = member.blockedAt ? new Date(member.blockedAt).toLocaleDateString() : "Unknown";
    const reason = member.blockReason || "No reason provided";

    return (
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
          colors={["#E24A4A", "#C62828"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 12,
            padding: 1.5,
          }}
        >
          <View style={{ backgroundColor: C.card, borderRadius: 12, padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Image
                source={{ uri: `https://i.pravatar.cc/80?u=${userId}` }}
                style={{ width: 50, height: 50, borderRadius: 25 }}
              />
              
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: C.text, fontSize: 16, fontWeight: "700" }}>
                  User {userId.substring(0, 8)}...
                </Text>
                <Text style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
                  Blocked: {blockedDate}
                </Text>
                <Text style={{ color: "#E24A4A", fontSize: 12, marginTop: 2, fontWeight: "600" }}>
                  ⛔ BLOCKED
                </Text>
              </View>
            </View>

            {reason !== "No reason provided" && (
              <View
                style={{
                  backgroundColor: "#1a1a1a",
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Block Reason:</Text>
                <Text style={{ color: "#aaa", fontSize: 13 }}>{reason}</Text>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => handleUnblock(member.id, `User ${userId.substring(0, 8)}`)}
                style={{
                  flex: 1,
                  backgroundColor: "#4CAF50",
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                  ✓ Unblock
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleRemove(member.id, `User ${userId.substring(0, 8)}`)}
                style={{
                  flex: 1,
                  backgroundColor: "#D32F2F",
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{ color: "#888", marginTop: 12 }}>Loading blocked members...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>⛔ Blocked Members</Text>
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
          Total Blocked: {blockedMembers.length}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by user ID..."
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

      {/* Blocked Members List */}
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {filteredMembers.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: "#888", fontSize: 16 }}>
              {searchQuery ? "No blocked members found" : "No blocked members"}
            </Text>
            <Text style={{ color: "#666", fontSize: 13, marginTop: 8 }}>
              Blocked members will appear here
            </Text>
          </View>
        ) : (
          filteredMembers.map((member) => <BlockedMemberCard key={member.id} member={member} />)
        )}
      </ScrollView>
    </View>
  );
}
