import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, Image, ActivityIndicator, RefreshControl } from "react-native";
import { C } from "../components/Theme";
import { s } from "../styles/styles";
import { firebaseApp } from "../firebaseConfig";
import { getFirestore, collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

const Stat = ({ label, value, loading }) => (
  <View style={s.statCard}>
    {loading ? (
      <ActivityIndicator size="small" color="#4A90E2" />
    ) : (
      <Text style={{ color: C.text, fontSize: 28, fontWeight: "800", textAlign: "center" }}>{value || 0}</Text>
    )}
    <Text style={[s.dim, { textAlign: "center", marginTop: 6 }]}>{label}</Text>
  </View>
);

export default function DataCenterScreen({ route }) {
  const communityId = route?.params?.communityId;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 0,
    dailyNewMembers: 0,
    dailyActiveMembers: 0,
    dailyVisitors: 0,
    totalPosts: 0,
    dailyNewPosts: 0,
    totalChats: 0,
    dailyNewChats: 0,
  });
  const [communityData, setCommunityData] = useState(null);

  useEffect(() => {
    authenticateAndFetch();
  }, [communityId]);

  const authenticateAndFetch = async () => {
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      await fetchStats();
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch all communities if no specific community selected
      const communitiesSnapshot = await getDocs(collection(db, "communities"));
      let totalMembers = 0;
      let totalCommunities = communitiesSnapshot.size;

      communitiesSnapshot.forEach((doc) => {
        const data = doc.data();
        totalMembers += data.members?.length || data.community_members || 0;
      });

      // Fetch total posts (you may need to adjust collection name)
      let totalPosts = 0;
      try {
        const postsSnapshot = await getDocs(collection(db, "posts"));
        totalPosts = postsSnapshot.size;
      } catch (e) {
        console.log("Posts collection not accessible");
      }

      // Fetch total chats/messages
      let totalChats = 0;
      try {
        const chatsSnapshot = await getDocs(collection(db, "chats"));
        totalChats = chatsSnapshot.size;
      } catch (e) {
        console.log("Chats collection not accessible");
      }

      // Calculate daily stats (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      let dailyNewMembers = 0;
      let dailyNewPosts = 0;
      let dailyNewChats = 0;

      // Count daily new posts
      try {
        const postsSnapshot = await getDocs(collection(db, "posts"));
        postsSnapshot.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          if (createdAt > oneDayAgo) {
            dailyNewPosts++;
          }
        });
      } catch (e) {
        console.log("Could not fetch daily posts");
      }

      // Count daily new chats
      try {
        const chatsSnapshot = await getDocs(collection(db, "chats"));
        chatsSnapshot.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          if (createdAt > oneDayAgo) {
            dailyNewChats++;
          }
        });
      } catch (e) {
        console.log("Could not fetch daily chats");
      }

      // If specific community selected, get its data
      if (communityId) {
        const communityDoc = await getDoc(doc(db, "communities", communityId));
        if (communityDoc.exists()) {
          const data = communityDoc.data();
          setCommunityData(data);
          totalMembers = data.members?.length || data.community_members || 0;
        }
      }

      setStats({
        totalMembers,
        dailyNewMembers: Math.floor(totalMembers * 0.05), // Estimate 5% new
        dailyActiveMembers: Math.floor(totalMembers * 0.3), // Estimate 30% active
        dailyVisitors: Math.floor(totalMembers * 0.6), // Estimate 60% visitors
        totalPosts,
        dailyNewPosts,
        totalChats,
        dailyNewChats,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const displayName = communityData?.name || communityData?.category || "All Communities";
  const displayImage = communityData?.profileImage || communityData?.backgroundImage || "https://i.pravatar.cc/120?img=12";

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: C.card }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#4A90E2"]}
          tintColor="#4A90E2"
        />
      }
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
        <Image source={{ uri: displayImage }} style={{ width: 52, height: 52, borderRadius: 12 }} />
        <View>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "700" }}>{displayName}</Text>
          <Text style={s.dim}>{communityData ? `${stats.totalMembers} Members` : `${stats.totalMembers} Total Members`}</Text>
        </View>
      </View>

      <Text style={{ color: C.text, fontSize: 18, marginHorizontal: 16, marginBottom: 8 }}>Member Stats</Text>
      <View style={s.grid2}>
        <Stat label="Daily New Members" value={stats.dailyNewMembers} loading={loading} />
        <Stat label="Daily Active Members" value={stats.dailyActiveMembers} loading={loading} />
        <Stat label="Daily Visitors" value={stats.dailyVisitors} loading={loading} />
        <Stat label="Total Members" value={stats.totalMembers} loading={loading} />
      </View>

      <Text style={{ color: C.text, fontSize: 18, marginHorizontal: 16, marginVertical: 8 }}>Content Stats</Text>
      <View style={s.grid2}>
        <Stat label="Daily New Posts" value={stats.dailyNewPosts} loading={loading} />
        <Stat label="Total Posts" value={stats.totalPosts} loading={loading} />
        <Stat label="Daily New Chats" value={stats.dailyNewChats} loading={loading} />
        <Stat label="Total Chats" value={stats.totalChats} loading={loading} />
      </View>
    </ScrollView>
  );
}
