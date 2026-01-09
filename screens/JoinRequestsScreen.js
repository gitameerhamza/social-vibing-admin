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
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export default function JoinRequestsScreen({ navigation, route }) {
  const communityId = route?.params?.communityId;
  const communityName = route?.params?.communityName;
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "join_requests"),
        where("communityId", "==", communityId),
        where("status", "==", "pending")
      );
      
      const querySnapshot = await getDocs(q);
      const requestsData = [];
      
      querySnapshot.forEach((doc) => {
        requestsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      setRequests(requestsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching requests:", error);
      Alert.alert("Error", "Failed to load join requests");
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, userId, userName) => {
    Alert.alert(
      "Approve Request",
      `Approve ${userName || "this user"} to join the community?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              // Update request status
              await updateDoc(doc(db, "join_requests", requestId), {
                status: "approved",
                approvedBy: auth.currentUser?.uid || "admin",
                approvedAt: new Date().toISOString(),
              });

              // Add user to community members
              await addDoc(collection(db, "communities_members"), {
                communityId: communityId,
                userId: userId,
                joinedAt: new Date().toISOString(),
                role: "member",
                active: true,
              });

              Alert.alert("Success", "User approved and added to community");
              fetchRequests();
            } catch (error) {
              console.error("Error approving request:", error);
              Alert.alert("Error", "Failed to approve request");
            }
          },
        },
      ]
    );
  };

  const handleReject = async (requestId, userName) => {
    Alert.alert(
      "Reject Request",
      `Reject ${userName || "this user"}'s request to join?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "join_requests", requestId), {
                status: "rejected",
                rejectedBy: auth.currentUser?.uid || "admin",
                rejectedAt: new Date().toISOString(),
              });

              Alert.alert("Success", "Request rejected");
              fetchRequests();
            } catch (error) {
              console.error("Error rejecting request:", error);
              Alert.alert("Error", "Failed to reject request");
            }
          },
        },
      ]
    );
  };

  const filteredRequests = requests.filter((request) => {
    const searchLower = searchQuery.toLowerCase();
    const userId = request.userId || "";
    return userId.toLowerCase().includes(searchLower);
  });

  const RequestCard = ({ request }) => {
    const userId = request.userId || request.id;
    const requestDate = new Date(request.createdAt || request.requestedAt).toLocaleDateString();

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
          colors={C.gradientGreen}
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
                  Requested: {requestDate}
                </Text>
                {request.message && (
                  <Text style={{ color: "#aaa", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>
                    "{request.message}"
                  </Text>
                )}
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => handleApprove(request.id, userId, `User ${userId.substring(0, 8)}`)}
                style={{
                  flex: 1,
                  backgroundColor: "#4CAF50",
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                  ✓ Approve
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleReject(request.id, `User ${userId.substring(0, 8)}`)}
                style={{
                  flex: 1,
                  backgroundColor: "#E24A4A",
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                  ✗ Reject
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
        <Text style={{ color: "#888", marginTop: 12 }}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>📩 Join Requests</Text>
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
          Pending Requests: {requests.length}
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

      {/* Requests List */}
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {filteredRequests.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: "#888", fontSize: 16 }}>
              {searchQuery ? "No requests found" : "No pending join requests"}
            </Text>
            <Text style={{ color: "#666", fontSize: 13, marginTop: 8 }}>
              New requests will appear here
            </Text>
          </View>
        ) : (
          filteredRequests.map((request) => <RequestCard key={request.id} request={request} />)
        )}
      </ScrollView>
    </View>
  );
}
