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
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { s } from "../styles/styles";
import { C } from "../components/Theme";
import SectionHeader from "../components/SectionHeader";
import { firebaseApp } from "../firebaseConfig";
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where, updateDoc, getDoc, arrayRemove } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export default function CommunityMembersScreen({ navigation, route }) {
  const communityId = route?.params?.communityId;
  const communityName = route?.params?.communityName;
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (communityId) {
      authenticateAndFetch();
    }
  }, [communityId]);

  const authenticateAndFetch = async () => {
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      fetchMembers();
    } catch (error) {
      console.error("Authentication error:", error);
      Alert.alert("Authentication Error", "Failed to authenticate.");
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      console.log("Fetching members for community:", communityId);
      
      // Fetch the community document to get members array
      const communityDoc = await getDoc(doc(db, "communities", communityId));
      
      if (!communityDoc.exists()) {
        console.log("Community not found!");
        Alert.alert("Error", "Community not found");
        setLoading(false);
        return;
      }
      
      const communityData = communityDoc.data();
      console.log("Community data:", communityData);
      
      const membersArray = communityData.members || [];
      const adminIds = communityData.adminIds || [];
      console.log("Members array from community:", membersArray);
      console.log("Admin IDs array:", adminIds);
      
      // Fetch user details for each member
      const membersData = await Promise.all(
        membersArray.map(async (userId, index) => {
          try {
            // Fetch user profile from users collection
            const userDoc = await getDoc(doc(db, "users", userId));
            const userData = userDoc.exists() ? userDoc.data() : null;
            
            console.log(`User ${userId} data:`, userData);
            
            // Try multiple possible field names for profile picture
            let photoURL = null;
            if (userData) {
              photoURL = userData.photoURL || 
                        userData.profilePicture || 
                        userData.profileImage ||
                        userData.avatar || 
                        userData.image ||
                        userData.photo ||
                        userData.picture ||
                        null;
              
              console.log(`User ${userId} photoURL:`, photoURL);
            }
            
            // Check if user is admin: either main admin or in adminIds array
            // Main admin = current owner (adminId field), cannot be removed
            // Co-admin = in adminIds array, can be removed
            const isCoAdmin = adminIds.includes(userId);
            const isMainAdmin = (userId === communityData.adminId) && !isCoAdmin;
            const isAdmin = isMainAdmin || isCoAdmin;
            
            return {
              id: `member_${index}`,
              userId: userId,
              communityId: communityId,
              role: isAdmin ? "admin" : "member",
              isMainAdmin: isMainAdmin,
              joinedAt: communityData.createdAt || new Date().toISOString(),
              blocked: false,
              // User profile data
              displayName: userData?.displayName || userData?.username || userData?.name || `User ${userId.substring(0, 8)}`,
              photoURL: photoURL,
              email: userData?.email || null,
              userData: userData, // Store full user data for debugging
            };
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            const isCoAdmin = adminIds.includes(userId);
            const isMainAdmin = (userId === communityData.adminId) && !isCoAdmin;
            const isAdmin = isMainAdmin || isCoAdmin;
            return {
              id: `member_${index}`,
              userId: userId,
              communityId: communityId,
              role: isAdmin ? "admin" : "member",
              isMainAdmin: isMainAdmin,
              joinedAt: communityData.createdAt || new Date().toISOString(),
              blocked: false,
              displayName: `User ${userId.substring(0, 8)}`,
              photoURL: null,
              email: null,
            };
          }
        })
      );
      
      console.log("Total members loaded:", membersData.length);
      setMembers(membersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching members:", error);
      Alert.alert("Error", `Failed to load members: ${error.message}`);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  };

  const handleRemoveMember = async (memberId, memberName, userId) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${memberName || "this member"} from the community?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove from community's members array
              await updateDoc(doc(db, "communities", communityId), {
                members: arrayRemove(userId)
              });
              
              Alert.alert("Success", "Member removed successfully");
              fetchMembers();
            } catch (error) {
              console.error("Error removing member:", error);
              Alert.alert("Error", "Failed to remove member");
            }
          },
        },
      ]
    );
  };

  const handleBlockMember = async (memberId, memberName, isBlocked, userId) => {
    const action = isBlocked ? "Unblock" : "Block";
    
    Alert.alert(
      `${action} Member`,
      `Are you sure you want to ${action.toLowerCase()} ${memberName || "this member"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action,
          style: isBlocked ? "default" : "destructive",
          onPress: async () => {
            try {
              // For now, we'll store blocked members in a separate collection
              // You can modify this based on your data structure
              Alert.alert("Info", "Block/Unblock feature needs separate blocked_members collection");
              
              // Alternatively, remove from community
              if (!isBlocked) {
                await updateDoc(doc(db, "communities", communityId), {
                  members: arrayRemove(userId)
                });
                Alert.alert("Success", "Member removed from community");
                fetchMembers();
              }
            } catch (error) {
              console.error(`Error ${action.toLowerCase()}ing member:`, error);
              Alert.alert("Error", `Failed to ${action.toLowerCase()} member`);
            }
          },
        },
      ]
    );
  };

  const handleMakeAdmin = async (memberId, memberName, userId) => {
    Alert.alert(
      "Make Co-Admin",
      `Make ${memberName || "this member"} a co-admin of this community?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              // Get current community data
              const communityDoc = await getDoc(doc(db, "communities", communityId));
              const communityData = communityDoc.data();
              const currentAdminIds = communityData.adminIds || [];
              
              // Add user to adminIds array if not already present
              if (!currentAdminIds.includes(userId)) {
                currentAdminIds.push(userId);
                
                await updateDoc(doc(db, "communities", communityId), {
                  adminIds: currentAdminIds,
                  updatedAt: new Date().toISOString(),
                });
                
                Alert.alert("Success", "Member promoted to co-admin successfully");
                fetchMembers();
              } else {
                Alert.alert("Info", "This user is already an admin");
              }
            } catch (error) {
              console.error("Error promoting member:", error);
              Alert.alert("Error", "Failed to promote member");
            }
          },
        },
      ]
    );
  };

  const handleRemoveAdmin = async (memberId, memberName, userId) => {
    Alert.alert(
      "Remove Admin Role",
      `Remove admin privileges from ${memberName || "this member"}? They will become a regular member.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              // Get current community data
              const communityDoc = await getDoc(doc(db, "communities", communityId));
              const communityData = communityDoc.data();
              const currentAdminIds = communityData.adminIds || [];
              
              // Check if user is in adminIds array
              if (!currentAdminIds.includes(userId)) {
                Alert.alert("Cannot Remove", "This user is not a co-admin or is the main owner. Transfer ownership first if needed.");
                return;
              }
              
              // Remove user from adminIds array
              const updatedAdminIds = currentAdminIds.filter(id => id !== userId);
              
              await updateDoc(doc(db, "communities", communityId), {
                adminIds: updatedAdminIds,
                updatedAt: new Date().toISOString(),
              });
              
              Alert.alert("Success", `${memberName} has been demoted to regular member`);
              // Refresh the members list to show updated status
              fetchMembers();
            } catch (error) {
              console.error("Error removing admin:", error);
              Alert.alert("Error", "Failed to remove admin privileges");
            }
          },
        },
      ]
    );
  };

  const filteredMembers = members.filter((member) => {
    const searchLower = searchQuery.toLowerCase();
    const userId = member.userId || member.id || "";
    const displayName = member.displayName || "";
    const email = member.email || "";
    
    return userId.toLowerCase().includes(searchLower) ||
           displayName.toLowerCase().includes(searchLower) ||
           email.toLowerCase().includes(searchLower);
  });

  const MemberCard = ({ member }) => {
    const isBlocked = member.blocked || false;
    const role = member.role || "member";
    const userId = member.userId || member.id;
    const displayName = member.displayName || `User ${userId.substring(0, 8)}`;
    const isMainAdmin = member.isMainAdmin || false; // Track if this is the main admin
    
    // Check if user has a valid profile image
    const hasProfileImage = member.photoURL && member.photoURL !== '';
    
    console.log(`Rendering member ${userId}: hasProfileImage = ${hasProfileImage}, photoURL = ${member.photoURL}`);

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
          colors={isBlocked ? ["#E24A4A", "#C62828"] : role === "admin" ? C.gradientGreen : C.gradientBlue}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 12,
            padding: 1.5,
          }}
        >
          <View style={{ backgroundColor: C.card, borderRadius: 12, padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              {/* Profile Image or Icon */}
              {hasProfileImage ? (
                <Image
                  source={{ uri: member.photoURL }}
                  style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#2a2a2a" }}
                  onError={(e) => {
                    console.log("Image load error for user:", userId, "URL:", member.photoURL);
                  }}
                  onLoad={() => {
                    console.log("Image loaded successfully for:", userId);
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: "#2a2a2a",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="person" size={28} color="#888" />
                </View>
              )}
              
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: C.text, fontSize: 16, fontWeight: "700" }}>
                    {displayName}
                  </Text>
                  {role === "admin" && (
                    <Text style={{ 
                      marginLeft: 8,
                      color: isMainAdmin ? "#FFC107" : "#4CAF50",
                      fontSize: 11,
                      fontWeight: "600",
                      backgroundColor: isMainAdmin ? "#3E2723" : "#1B5E20",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}>
                      {isMainAdmin ? "OWNER" : "ADMIN"}
                    </Text>
                  )}
                </View>
                
                <Text style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
                  ID: {userId.substring(0, 20)}...
                </Text>
                
                {isBlocked && (
                  <Text style={{ color: "#E24A4A", fontSize: 12, marginTop: 2, fontWeight: "600" }}>
                    ⛔ BLOCKED
                  </Text>
                )}
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8 }}>
              {role === "admin" && !isMainAdmin ? (
                <TouchableOpacity
                  onPress={() => handleRemoveAdmin(member.id, displayName, userId)}
                  style={{
                    flex: 1,
                    backgroundColor: "#FF9800",
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                    ⬇ Remove Admin
                  </Text>
                </TouchableOpacity>
              ) : role !== "admin" ? (
                <TouchableOpacity
                  onPress={() => handleMakeAdmin(member.id, displayName, userId)}
                  style={{
                    flex: 1,
                    backgroundColor: "#4CAF50",
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                    ✓ Make Admin
                  </Text>
                </TouchableOpacity>
              ) : null}
              
              {!isMainAdmin && (
                <TouchableOpacity
                  onPress={() => handleRemoveMember(member.id, displayName, userId)}
                  style={{
                    flex: 1,
                    backgroundColor: "#E24A4A",
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>✗ Remove</Text>
                </TouchableOpacity>
              )}
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
        <Text style={{ color: "#888", marginTop: 12 }}>Loading members...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>👥 Community Members</Text>
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
          Total Members: {members.length} | 
          Blocked: {members.filter((m) => m.blocked).length}
        </Text>
        <Text style={{ color: "#666", fontSize: 11, marginTop: 4 }}>
          Community ID: {communityId?.substring(0, 20)}...
        </Text>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, ID, or email..."
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
      <SectionHeader title={`All Members (${filteredMembers.length})`} />
      
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4A90E2"]}
            tintColor="#4A90E2"
          />
        }
      >
        {filteredMembers.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: "#888", fontSize: 16 }}>
              {searchQuery ? "No members found" : "No members in this community"}
            </Text>
            <Text style={{ color: "#666", fontSize: 13, marginTop: 8 }}>
              Members will appear here when they join
            </Text>
            
            {/* Debug Info */}
            <TouchableOpacity
              onPress={fetchMembers}
              style={{
                marginTop: 20,
                backgroundColor: "#4A90E2",
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>🔄 Refresh</Text>
            </TouchableOpacity>
            
            <View style={{ marginTop: 20, padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8, width: "100%" }}>
              <Text style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>Debug Info:</Text>
              <Text style={{ color: "#666", fontSize: 11 }}>
                Community ID: {communityId}{"\n"}
                Total Members Loaded: {members.length}{"\n"}
                Check console for more details
              </Text>
            </View>
          </View>
        ) : (
          filteredMembers.map((member) => <MemberCard key={member.id} member={member} />)
        )}
      </ScrollView>
    </View>
  );
}
