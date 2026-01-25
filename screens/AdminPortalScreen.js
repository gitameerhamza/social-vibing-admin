import React, { useState, useEffect } from "react";
import { View, ScrollView, Text, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { s } from "../styles/styles";
import { C } from "../components/Theme";
import SectionHeader from "../components/SectionHeader";
import { firebaseApp } from "../firebaseConfig";
import { getFirestore, collection, getDocs, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export default function AdminPortalScreen({ navigation }) {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const go = (screen) => navigation.navigate(screen);

  // Authenticate and fetch communities
  useEffect(() => {
    authenticateAndFetch();
  }, []);

  const authenticateAndFetch = async () => {
    try {
      // Sign in anonymously if not already signed in
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      fetchCommunities();
    } catch (error) {
      console.error("Authentication error:", error);
      Alert.alert("Authentication Error", "Failed to authenticate. Please restart the app.");
    }
  };

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "communities"));
      const communitiesData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Calculate actual member count from members array
        const actualMembersCount = data.members?.length || 0;
        communitiesData.push({
          id: doc.id,
          ...data,
          community_members: actualMembersCount, // Override with actual count
        });
      });
      setCommunities(communitiesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching communities:", error);
      Alert.alert("Error", "Failed to load communities");
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const querySnapshot = await getDocs(collection(db, "communities"));
      const communitiesData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Calculate actual member count from members array
        const actualMembersCount = data.members?.length || 0;
        communitiesData.push({
          id: doc.id,
          ...data,
          community_members: actualMembersCount, // Override with actual count
        });
      });
      setCommunities(communitiesData);
    } catch (error) {
      console.error("Error refreshing communities:", error);
    }
    setRefreshing(false);
  };

  // Delete community
  const handleDeleteCommunity = async (communityId, communityName) => {
    Alert.alert(
      "Delete Community",
      `Are you sure you want to delete "${communityName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "communities", communityId));
              Alert.alert("Success", "Community deleted successfully");
              fetchCommunities();
              setSelectedCommunity(null);
            } catch (error) {
              console.error("Error deleting community:", error);
              Alert.alert("Error", "Failed to delete community");
            }
          },
        },
      ]
    );
  };

  // View community details
  const handleViewCommunity = (community) => {
    setSelectedCommunity(community);
  };

  // Remove member from community
  const handleRemoveMember = async (communityId, memberId) => {
    Alert.alert(
      "Remove Member",
      "Are you sure you want to remove this member from the community?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              // Logic to remove member - this would depend on your data structure
              // For now, showing the alert
              Alert.alert("Success", "Member removed successfully");
              // You would implement the actual Firestore logic here
            } catch (error) {
              console.error("Error removing member:", error);
              Alert.alert("Error", "Failed to remove member");
            }
          },
        },
      ]
    );
  };

  // Go back to community list
  const handleBackToList = () => {
    setSelectedCommunity(null);
  };

  // Filter communities based on search
  const filteredCommunities = communities.filter((community) => {
    const searchLower = searchQuery.toLowerCase();
    const name = community.name || "";
    const category = community.category || "";
    return (
      name.toLowerCase().includes(searchLower) ||
      category.toLowerCase().includes(searchLower) ||
      community.id.toLowerCase().includes(searchLower)
    );
  });

  // 🔹 Border Gradient Row Component
  const BorderRow = ({ title, colors, onPress, icon }) => {
    const safeColors =
      Array.isArray(colors) && colors.length > 0
        ? colors
        : ["#3a3a3a", "#3a3a3a"]; // fallback border

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{
          marginHorizontal: 16,
          marginVertical: 6,
          borderRadius: 12,
          backgroundColor: C.card,
        }}
      >
        {/* Gradient Border */}
        <LinearGradient
          colors={safeColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 12,
            padding: 1.5,
          }}
        >
          <View
            style={{
              backgroundColor: C.card,
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {icon && <Text style={{ fontSize: 20, marginRight: 10 }}>{icon}</Text>}
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              {title}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // 🔹 Community Card Component
  const CommunityCard = ({ community, onPress, onDelete, onViewDetails }) => {
    const profileImage = community.profileImage || community.backgroundImage || "https://i.pravatar.cc/120?img=12";
    const communityName = community.name || community.category || "General";
    const category = community.category || "General";
    const membersCount = community.community_members || 0;

    return (
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
          colors={C.gradientBlue}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 12,
            padding: 1.5,
          }}
        >
          <View style={{ backgroundColor: C.card, borderRadius: 12, padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{ uri: profileImage }}
                style={{ width: 60, height: 60, borderRadius: 12 }}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: C.text, fontSize: 17, fontWeight: "700" }}>
                  {communityName}
                </Text>
                <Text style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
                  {category}
                </Text>
                <Text style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
                  👥 {membersCount} members
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", marginTop: 12, gap: 8 }}>
              <TouchableOpacity
                onPress={() => onViewDetails(community)}
                style={{
                  flex: 1,
                  backgroundColor: "#4A90E2",
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Manage</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDelete(community.id, category)}
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
  };

  // 🔹 Main View - Community List
  if (!selectedCommunity) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>🛡️ Admin Portal</Text>
        </View>

        {/* Stats Card */}
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
            Total Communities: {communities.length}
          </Text>
          <Text style={{ color: "#888", marginTop: 4 }}>
            Manage all communities from here
          </Text>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by category or ID..."
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

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <BorderRow
          title="Reports Dashboard"
          colors={C.gradientRed}
          icon="🚨"
          onPress={() => go("ReportsDashboard")}
        />
        <BorderRow
          title="Create New Community"
          colors={C.gradientGreen}
          icon="➕"
          onPress={() => go("CreateCommunity")}
        />
        <BorderRow
          title="Data Center"
          colors={C.gradientBlue}
          icon="📊"
          onPress={() => go("DataCenter")}
        />
        <BorderRow
          title="Advertisement Manager"
          colors={C.gradientPurple}
          icon="📢"
          onPress={() => go("Advertisement")}
        />

        {/* Communities List */}
        <SectionHeader title={`All Communities (${filteredCommunities.length})`} />

        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={{ color: "#888", marginTop: 12 }}>Loading communities...</Text>
          </View>
        ) : (
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
            {filteredCommunities.length === 0 ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ color: "#888", fontSize: 16 }}>
                  {searchQuery ? "No communities found" : "No communities yet"}
                </Text>
              </View>
            ) : (
              filteredCommunities.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  onDelete={handleDeleteCommunity}
                  onViewDetails={handleViewCommunity}
                />
              ))
            )}
          </ScrollView>
        )}
      </View>
    );
  }

  // 🔹 Detailed View - Selected Community Management
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header with Back Button */}
      <View style={[s.header, { flexDirection: "row", alignItems: "center" }]}>
        <TouchableOpacity onPress={handleBackToList} style={{ marginRight: 12 }}>
          <Text style={{ color: "#4A90E2", fontSize: 28 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Manage Community</Text>
      </View>

      {/* Community Card */}
      <View style={s.communityCard}>
        <Image
          source={{ uri: selectedCommunity.backgroundImage || "https://i.pravatar.cc/120?img=12" }}
          style={{ width: 56, height: 56, borderRadius: 12 }}
        />
        <View style={{ marginLeft: 12 }}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "700" }}>
            {selectedCommunity.category || "Community"}
          </Text>
          <Text style={s.dim}>ID: {selectedCommunity.id.substring(0, 15)}...</Text>
          <Text style={{ color: "#888", fontSize: 13 }}>
            👥 {selectedCommunity.community_members || 0} members
          </Text>
        </View>
      </View>

      {/* Scroll Section */}
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Content Section */}
        <SectionHeader title="Content Management" />
        <BorderRow title="Cover Image" colors={C.gradientPurple} icon="🖼️" onPress={() => navigation.navigate("CoverImage", { 
          communityId: selectedCommunity.id,
          communityName: selectedCommunity.category 
        })} />
        <BorderRow
          title="Home Layout"
          colors={C.gradientOrange}
          icon="🏠"
          onPress={() => go("HomeLayout")}
        />
        <BorderRow
          title="Community Folders"
          colors={C.gradientMixed}
          icon="📁"
          onPress={() => go("CommunityFolders")}
        />
        <BorderRow
          title="Community Rooms"
          colors={C.gradientBlue}
          icon="🚪"
          onPress={() => go("CommunityRooms")}
        />
        <BorderRow title="Blocked Content" colors={C.gradientRed} icon="🚫" onPress={() => navigation.navigate("BlockedContent", { 
          communityId: selectedCommunity.id,
          communityName: selectedCommunity.category 
        })} />
        <BorderRow
          title="Add Advertisement"
          colors={C.gradientPurple}
          icon="📢"
          onPress={() => navigation.navigate("Advertisement", { communityId: selectedCommunity.id })}
        />

        {/* Members Section */}
        <SectionHeader title="Member Management" />
        <BorderRow
          title="View All Members"
          colors={C.gradientBlue}
          icon="👥"
          onPress={() => navigation.navigate("CommunityMembers", { 
            communityId: selectedCommunity.id,
            communityName: selectedCommunity.category 
          })}
        />
        <BorderRow
          title="Community Titles"
          colors={C.gradientPurple}
          icon="🏆"
          onPress={() => go("CommunityTitles")}
        />
        <BorderRow
          title="Remove Member"
          colors={C.gradientRed}
          icon="👤"
          onPress={() => navigation.navigate("CommunityMembers", { 
            communityId: selectedCommunity.id,
            communityName: selectedCommunity.category 
          })}
        />
        <BorderRow title="Requests to Join" colors={C.gradientGreen} icon="📩" onPress={() => navigation.navigate("JoinRequests", { 
          communityId: selectedCommunity.id,
          communityName: selectedCommunity.category 
        })} />
        <BorderRow title="Blocked Members" colors={C.gradientRed} icon="⛔" onPress={() => navigation.navigate("BlockedMembers", { 
          communityId: selectedCommunity.id,
          communityName: selectedCommunity.category 
        })} />

        {/* Management Section */}
        <SectionHeader title="Management Team" />
        <BorderRow
          title="Manage Co-Admins"
          colors={C.gradientBlue}
          icon="👨‍💼"
          onPress={() => go("ManageCoAdmins")}
        />
        <BorderRow title="Transfer Admin" colors={C.gradientPink} icon="🔄" onPress={() => navigation.navigate("TransferAdmin", { 
          communityId: selectedCommunity.id,
          communityName: selectedCommunity.category,
          currentAdminId: selectedCommunity.adminId || selectedCommunity.uid
        })} />
        <BorderRow title="Management Records" colors={C.gradientMixed} icon="📝" onPress={() => navigation.navigate("ManagementRecords", { 
          communityId: selectedCommunity.id,
          communityName: selectedCommunity.category 
        })} />

        {/* Delete Button */}
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            onPress={() => handleDeleteCommunity(selectedCommunity.id, selectedCommunity.category)}
            style={{
              borderWidth: 1,
              borderColor: "#D14B4B",
              paddingVertical: 14,
              alignItems: "center",
              borderRadius: 12,
              backgroundColor: "transparent",
            }}
          >
            <Text style={{ color: "#FF6B6B", fontWeight: "700" }}>
              Delete this Community
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
