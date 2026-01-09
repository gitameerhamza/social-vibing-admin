import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { s } from "../styles/styles";
import { C } from "../components/Theme";
import { firebaseApp } from "../firebaseConfig";
import { getFirestore, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export default function ManagementRecordsScreen({ navigation, route }) {
  const communityId = route?.params?.communityId;
  const communityName = route?.params?.communityName;
  
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, admin, member, content

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "management_records"),
        where("communityId", "==", communityId),
        orderBy("timestamp", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const recordsData = [];
      
      querySnapshot.forEach((doc) => {
        recordsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      setRecords(recordsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching records:", error);
      // Try without orderBy if index not created
      try {
        const q = query(
          collection(db, "management_records"),
          where("communityId", "==", communityId)
        );
        
        const querySnapshot = await getDocs(q);
        const recordsData = [];
        
        querySnapshot.forEach((doc) => {
          recordsData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        
        // Sort in memory
        recordsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        setRecords(recordsData);
        setLoading(false);
      } catch (fallbackError) {
        Alert.alert("Error", "Failed to load management records");
        setLoading(false);
      }
    }
  };

  const getRecordIcon = (type) => {
    switch (type) {
      case "admin_transfer": return "🔄";
      case "co_admin_added": return "👨‍💼";
      case "co_admin_removed": return "👨‍💼";
      case "member_blocked": return "⛔";
      case "member_unblocked": return "✓";
      case "member_removed": return "🚫";
      case "content_blocked": return "🚫";
      case "content_deleted": return "🗑️";
      case "settings_changed": return "⚙️";
      case "community_updated": return "📝";
      default: return "📋";
    }
  };

  const getRecordColor = (type) => {
    switch (type) {
      case "admin_transfer": return C.gradientPink;
      case "co_admin_added": return C.gradientGreen;
      case "co_admin_removed": return C.gradientOrange;
      case "member_blocked": return C.gradientRed;
      case "member_unblocked": return C.gradientGreen;
      case "member_removed": return C.gradientRed;
      case "content_blocked": return C.gradientRed;
      case "content_deleted": return ["#666", "#444"];
      case "settings_changed": return C.gradientBlue;
      case "community_updated": return C.gradientPurple;
      default: return C.gradientBlue;
    }
  };

  const filteredRecords = records.filter((record) => {
    if (filter === "all") return true;
    if (filter === "admin") return record.type?.includes("admin");
    if (filter === "member") return record.type?.includes("member");
    if (filter === "content") return record.type?.includes("content");
    return true;
  });

  const RecordCard = ({ record }) => {
    const date = new Date(record.timestamp).toLocaleString();
    const icon = getRecordIcon(record.type);
    const colors = getRecordColor(record.type);

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
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 12,
            padding: 1.5,
          }}
        >
          <View style={{ backgroundColor: C.card, borderRadius: 12, padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>{icon}</Text>
              
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 16, fontWeight: "700", marginBottom: 4 }}>
                  {record.type?.replace(/_/g, " ").toUpperCase()}
                </Text>
                
                <Text style={{ color: "#aaa", fontSize: 13, marginBottom: 8 }}>
                  {record.details || "Action performed"}
                </Text>
                
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {record.fromUserId && (
                    <View style={{ backgroundColor: "#2a2a2a", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ color: "#888", fontSize: 11 }}>
                        From: {record.fromUserId.substring(0, 8)}...
                      </Text>
                    </View>
                  )}
                  
                  {record.toUserId && (
                    <View style={{ backgroundColor: "#2a2a2a", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ color: "#888", fontSize: 11 }}>
                        To: {record.toUserId.substring(0, 8)}...
                      </Text>
                    </View>
                  )}
                  
                  {record.performedBy && (
                    <View style={{ backgroundColor: "#2a2a2a", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ color: "#888", fontSize: 11 }}>
                        By: {record.performedBy.substring(0, 8)}...
                      </Text>
                    </View>
                  )}
                </View>
                
                <Text style={{ color: "#666", fontSize: 11, marginTop: 8 }}>
                  {date}
                </Text>
              </View>
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
        <Text style={{ color: "#888", marginTop: 12 }}>Loading records...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>📝 Management Records</Text>
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
          Total Records: {records.length}
        </Text>
      </View>

      {/* Filters */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 12, gap: 8 }}>
        {["all", "admin", "member", "content"].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={{
              flex: 1,
              backgroundColor: filter === f ? "#4A90E2" : "#2a2a2a",
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: filter === f ? "#fff" : "#888",
                fontSize: 13,
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Records List */}
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {filteredRecords.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: "#888", fontSize: 16 }}>
              No management records found
            </Text>
            <Text style={{ color: "#666", fontSize: 13, marginTop: 8 }}>
              Management actions will be recorded here
            </Text>
          </View>
        ) : (
          filteredRecords.map((record) => <RecordCard key={record.id} record={record} />)
        )}
      </ScrollView>
    </View>
  );
}
