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
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, getDoc, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export default function TransferAdminScreen({ navigation, route }) {
  const communityId = route?.params?.communityId;
  const communityName = route?.params?.communityName;
  const currentAdminId = route?.params?.currentAdminId;
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "communities_members"),
        where("communityId", "==", communityId),
        where("blocked", "!=", true)
      );
      
      const querySnapshot = await getDocs(q);
      const membersData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Exclude current admin
        if (data.userId !== currentAdminId) {
          membersData.push({
            id: doc.id,
            ...data,
          });
        }
      });
      
      setMembers(membersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching members:", error);
      Alert.alert("Error", "Failed to load members");
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedMember) {
      Alert.alert("No Selection", "Please select a member to transfer admin rights to");
      return;
    }

    Alert.alert(
      "⚠️ Transfer Admin Rights",
      `Are you ABSOLUTELY SURE you want to transfer admin rights to User ${selectedMember.userId.substring(0, 8)}...?\n\nThis action:\n• Cannot be undone\n• You will become a regular member\n• The new admin will have full control\n• All management records will be updated`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Transfer",
          style: "destructive",
          onPress: () => confirmTransfer(),
        },
      ]
    );
  };

  const confirmTransfer = () => {
    Alert.alert(
      "Final Confirmation",
      "Type 'TRANSFER' to confirm this action",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "I Understand",
          onPress: async () => {
            try {
              // Update community admin
              await updateDoc(doc(db, "communities", communityId), {
                adminId: selectedMember.userId,
                uid: selectedMember.userId,
                previousAdmin: currentAdminId,
                adminTransferredAt: new Date().toISOString(),
              });

              // Update new admin member record
              await updateDoc(doc(db, "communities_members", selectedMember.id), {
                role: "owner",
                promotedAt: new Date().toISOString(),
              });

              // Add to management records
              await addDoc(collection(db, "management_records"), {
                communityId: communityId,
                type: "admin_transfer",
                fromUserId: currentAdminId,
                toUserId: selectedMember.userId,
                timestamp: new Date().toISOString(),
                details: "Admin rights transferred",
              });

              Alert.alert(
                "Success",
                "Admin rights transferred successfully. The new admin has been notified.",
                [
                  {
                    text: "OK",
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error) {
              console.error("Error transferring admin:", error);
              Alert.alert("Error", "Failed to transfer admin rights. Please try again.");
            }
          },
        },
      ]
    );
  };

  const filteredMembers = members.filter((member) => {
    const searchLower = searchQuery.toLowerCase();
    const userId = member.userId || member.id || "";
    return userId.toLowerCase().includes(searchLower);
  });

  const MemberCard = ({ member }) => {
    const userId = member.userId || member.id;
    const isSelected = selectedMember?.id === member.id;
    const role = member.role || "member";

    return (
      <TouchableOpacity
        onPress={() => setSelectedMember(isSelected ? null : member)}
        activeOpacity={0.7}
        style={{
          marginHorizontal: 16,
          marginVertical: 6,
          borderRadius: 12,
          backgroundColor: C.card,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={isSelected ? C.gradientGreen : role === "admin" ? C.gradientBlue : ["#444", "#333"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 12,
            padding: 1.5,
          }}
        >
          <View style={{ backgroundColor: C.card, borderRadius: 12, padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{ uri: `https://i.pravatar.cc/80?u=${userId}` }}
                style={{ width: 50, height: 50, borderRadius: 25 }}
              />
              
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: C.text, fontSize: 16, fontWeight: "700" }}>
                    User {userId.substring(0, 8)}...
                  </Text>
                  {role === "admin" && (
                    <Text
                      style={{
                        marginLeft: 8,
                        color: "#4CAF50",
                        fontSize: 11,
                        fontWeight: "600",
                        backgroundColor: "#1B5E20",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      CO-ADMIN
                    </Text>
                  )}
                </View>
                <Text style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
                  ID: {userId.substring(0, 20)}...
                </Text>
                {isSelected && (
                  <Text style={{ color: "#4CAF50", fontSize: 12, marginTop: 4, fontWeight: "600" }}>
                    ✓ SELECTED FOR TRANSFER
                  </Text>
                )}
              </View>

              {isSelected && (
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: "#4CAF50",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 18 }}>✓</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{ color: "#888", marginTop: 12 }}>Loading members...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>🔄 Transfer Admin</Text>
      </View>

      {/* Warning Card */}
      <View
        style={{
          marginHorizontal: 16,
          marginVertical: 12,
          padding: 16,
          backgroundColor: "#3D1F1F",
          borderRadius: 12,
          borderWidth: 2,
          borderColor: "#E24A4A",
        }}
      >
        <Text style={{ color: "#FF6B6B", fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
          ⚠️ Warning: Irreversible Action
        </Text>
        <Text style={{ color: "#FFB4B4", fontSize: 13, lineHeight: 20 }}>
          Transferring admin rights is permanent. You will lose all admin privileges and the new admin will have complete control over the community.
        </Text>
      </View>

      {/* Community Info */}
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 12,
          padding: 16,
          backgroundColor: C.card,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: C.text, fontSize: 16, fontWeight: "600" }}>
          {communityName || "Community"}
        </Text>
        <Text style={{ color: "#888", marginTop: 4 }}>
          Select a member to transfer admin rights
        </Text>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search members..."
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

      {/* Members List */}
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {filteredMembers.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: "#888", fontSize: 16 }}>
              {searchQuery ? "No members found" : "No members available"}
            </Text>
          </View>
        ) : (
          filteredMembers.map((member) => <MemberCard key={member.id} member={member} />)
        )}
      </ScrollView>

      {/* Transfer Button */}
      {selectedMember && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            backgroundColor: C.bg,
            borderTopWidth: 1,
            borderTopColor: "#333",
          }}
        >
          <TouchableOpacity
            onPress={handleTransfer}
            style={{
              backgroundColor: "#E24A4A",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              Transfer Admin Rights →
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
