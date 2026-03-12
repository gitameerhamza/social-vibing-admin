import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { s } from "../styles/styles";
import { C } from "../components/Theme";
import SectionHeader from "../components/SectionHeader";
import { firebaseApp } from "../firebaseConfig";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export default function VerifyUsersScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, banned: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Use targeted query for pending users instead of loading all users
      const pendingQuery = query(collection(db, "users"), where("verificationStatus", "==", "pending"));
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingUsersData = [];
      pendingSnapshot.forEach((docSnap) => {
        pendingUsersData.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Load all users only when on "all" tab or for stats
      const usersSnapshot = await getDocs(collection(db, "users"));
      const allUsersData = [];
      let verifiedCount = 0, bannedCount = 0;

      usersSnapshot.forEach((docSnap) => {
        const userData = { id: docSnap.id, ...docSnap.data() };
        allUsersData.push(userData);
        if (userData.verificationStatus === "verified" || userData.isVerified) verifiedCount++;
        if (userData.isBanned) bannedCount++;
      });

      setAllUsers(allUsersData);
      setPendingUsers(pendingUsersData);
      setStats({ total: allUsersData.length, verified: verifiedCount, pending: pendingUsersData.length, banned: bannedCount });
      setLoading(false);
    } catch (error) {
      console.error("Error loading users:", error);
      Alert.alert("Error", "Failed to load users: " + error.message);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleApprove = async (userId, username) => {
    Alert.alert("Approve Verification", `Are you sure you want to approve ${username}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: async () => {
          try {
            await updateDoc(doc(db, "users", userId), {
              verificationStatus: "verified",
              isVerified: true,
              verifiedAt: serverTimestamp(),
              verifiedBy: auth.currentUser?.uid || "admin",
            });
            Alert.alert("Success", `${username} has been verified!`);
            await loadData();
          } catch (error) {
            console.error("Error approving user:", error);
            Alert.alert("Error", error.code === "permission-denied" ? "Permission denied. Check your admin role." : "Failed to approve user: " + error.message);
          }
        },
      },
    ]);
  };

  const handleReject = async (userId, username) => {
    Alert.prompt("Reject Verification", `Enter rejection reason for ${username}:`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async (reason) => {
          if (!reason || reason.trim() === "") {
            Alert.alert("Error", "Please provide a rejection reason");
            return;
          }
          try {
            await updateDoc(doc(db, "users", userId), {
              verificationStatus: "rejected",
              isVerified: false,
              rejectedAt: serverTimestamp(),
              rejectedBy: auth.currentUser?.uid || "admin",
              rejectionReason: reason,
            });
            Alert.alert("Success", `${username} verification has been rejected`);
            await loadData();
          } catch (error) {
            console.error("Error rejecting user:", error);
            Alert.alert("Error", error.code === "permission-denied" ? "Permission denied." : "Failed to reject user: " + error.message);
          }
        },
      },
    ], "plain-text");
  };

  const handleBan = async (userId, username) => {
    Alert.prompt("Ban User", `Enter ban reason for ${username}:`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Ban",
        style: "destructive",
        onPress: async (reason) => {
          if (!reason || reason.trim() === "") {
            Alert.alert("Error", "Please provide a ban reason");
            return;
          }
          try {
            await updateDoc(doc(db, "users", userId), {
              isBanned: true,
              banReason: reason,
              bannedAt: serverTimestamp(),
              bannedBy: auth.currentUser?.uid || "admin",
            });
            Alert.alert("Success", `${username} has been banned`);
            await loadData();
          } catch (error) {
            console.error("Error banning user:", error);
            Alert.alert("Error", error.code === "permission-denied" ? "Permission denied." : "Failed to ban user: " + error.message);
          }
        },
      },
    ], "plain-text");
  };

  const handleUnban = async (userId, username) => {
    Alert.alert("Unban User", `Are you sure you want to unban ${username}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unban",
        onPress: async () => {
          try {
            await updateDoc(doc(db, "users", userId), {
              isBanned: false,
              unbannedAt: serverTimestamp(),
              unbannedBy: auth.currentUser?.uid || "admin",
            });
            Alert.alert("Success", `${username} has been unbanned`);
            await loadData();
          } catch (error) {
            console.error("Error unbanning user:", error);
            Alert.alert("Error", error.code === "permission-denied" ? "Permission denied." : "Failed to unban user: " + error.message);
          }
        },
      },
    ]);
  };

  const handleRevoke = async (userId, username) => {
    Alert.alert("Revoke Verification", `Are you sure you want to revoke verification for ${username}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Revoke",
        style: "destructive",
        onPress: async () => {
          try {
            await updateDoc(doc(db, "users", userId), {
              verificationStatus: "revoked",
              isVerified: false,
              revokedAt: serverTimestamp(),
              revokedBy: auth.currentUser?.uid || "admin",
            });
            Alert.alert("Success", `Verification revoked for ${username}`);
            await loadData();
          } catch (error) {
            console.error("Error revoking verification:", error);
            Alert.alert("Error", error.code === "permission-denied" ? "Permission denied." : "Failed to revoke verification: " + error.message);
          }
        },
      },
    ]);
  };

  const openDocument = (url) => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert("Error", "Failed to open document"));
    } else {
      Alert.alert("Error", "No document URL available");
    }
  };

  const filteredUsers = activeTab === "all"
    ? allUsers.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    : pendingUsers;

  const renderUserCard = (user) => {
    const isVerified = user.verificationStatus === "verified" || user.isVerified;
    const isPending = user.verificationStatus === "pending";
    const isBanned = user.isBanned;
    const isRejected = user.verificationStatus === "rejected";
    const isRevoked = user.verificationStatus === "revoked";

    return (
      <View key={user.id} style={styles.userCard}>
        <View style={styles.userInfo}>
          <Image source={{ uri: user.profilePicture || "https://via.placeholder.com/80" }} style={styles.profileImage} />
          <View style={styles.userDetails}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{user.username || "N/A"}</Text>
              {isVerified && <Text style={styles.verifiedBadge}>🛡️</Text>}
              {isBanned && <View style={styles.bannedBadge}><Text style={styles.bannedText}>🚫 BANNED</Text></View>}
            </View>
            <Text style={styles.email}>{user.email || "N/A"}</Text>
            <Text style={styles.infoText}>DOB: {user.dateOfBirth || "N/A"} | Age: {user.age || "N/A"}</Text>
            <Text style={styles.infoText}>📄 Document: {user.documentType || "N/A"}</Text>
            {user.verificationSubmittedAt && (
              <Text style={styles.infoText}>📅 Submitted: {user.verificationSubmittedAt?.toDate ? user.verificationSubmittedAt.toDate().toLocaleDateString() : new Date(user.verificationSubmittedAt).toLocaleDateString()}</Text>
            )}
            {isPending && <Text style={styles.statusPending}>⏱️ Pending</Text>}
            {isRejected && <Text style={styles.statusRejected}>❌ Rejected: {user.rejectionReason || "No reason"}</Text>}
            {isRevoked && <Text style={styles.statusRevoked}>⚠️ Revoked</Text>}
          </View>
        </View>

        {user.verificationDocument && (
          <TouchableOpacity style={styles.viewDocButton} onPress={() => openDocument(user.verificationDocument)}>
            <Ionicons name="document-text-outline" size={18} color={C.accent} />
            <Text style={styles.viewDocText}>View ID Document</Text>
          </TouchableOpacity>
        )}

        <View style={styles.actionButtons}>
          {isPending && (
            <>
              <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => handleApprove(user.id, user.username)}>
                <Text style={styles.actionButtonText}>✓ Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleReject(user.id, user.username)}>
                <Text style={styles.actionButtonText}>✗ Reject</Text>
              </TouchableOpacity>
            </>
          )}
          {activeTab === "all" && !isPending && (
            <>
              {!isBanned && (
                <TouchableOpacity style={[styles.actionButton, styles.banButton]} onPress={() => handleBan(user.id, user.username)}>
                  <Text style={styles.actionButtonText}>🚫 Ban</Text>
                </TouchableOpacity>
              )}
              {isBanned && (
                <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => handleUnban(user.id, user.username)}>
                  <Text style={styles.actionButtonText}>✓ Unban</Text>
                </TouchableOpacity>
              )}
              {isVerified && !isBanned && (
                <TouchableOpacity style={[styles.actionButton, styles.revokeButton]} onPress={() => handleRevoke(user.id, user.username)}>
                  <Text style={styles.actionButtonText}>⚠️ Revoke</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[s.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}>
        <SectionHeader title="🛡️ User Verification Dashboard" />

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={[styles.statCard, styles.statCardVerified]}>
            <Text style={styles.statNumber}>🛡️ {stats.verified}</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={[styles.statCard, styles.statCardPending]}>
            <Text style={styles.statNumber}>⏱️ {stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, styles.statCardBanned]}>
            <Text style={styles.statNumber}>🚫 {stats.banned}</Text>
            <Text style={styles.statLabel}>Banned</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabButton, activeTab === "pending" && styles.tabButtonActive]} onPress={() => setActiveTab("pending")}>
            <Text style={[styles.tabButtonText, activeTab === "pending" && styles.tabButtonTextActive]}>Pending ({stats.pending})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, activeTab === "all" && styles.tabButtonActive]} onPress={() => setActiveTab("all")}>
            <Text style={[styles.tabButtonText, activeTab === "all" && styles.tabButtonTextActive]}>All Users ({stats.total})</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "all" && (
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={C.dim} style={styles.searchIcon} />
            <TextInput style={styles.searchInput} placeholder="Search by username or email..." placeholderTextColor={C.dim} value={searchQuery} onChangeText={setSearchQuery} />
          </View>
        )}

        <View style={styles.usersContainer}>
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{activeTab === "pending" ? "🎉 No pending verifications!" : "No users found"}</Text>
            </View>
          ) : (
            filteredUsers.map(renderUserCard)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = {
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },
  loadingText: { marginTop: 12, color: C.dim, fontSize: 16 },
  loginContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg, padding: 20 },
  loginCard: { width: "100%", maxWidth: 400, backgroundColor: C.card, borderRadius: 16, padding: 32, borderWidth: 1, borderColor: C.border },
  loginTitle: { fontSize: 28, fontWeight: "bold", color: C.accent, textAlign: "center", marginBottom: 8 },
  loginSubtitle: { fontSize: 14, color: C.dim, textAlign: "center", marginBottom: 32 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: C.card2, borderRadius: 8, borderWidth: 1, borderColor: C.border, marginBottom: 16, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  statLabel: { fontSize: 12, color: C.dim },
  tabContainer: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 16, gap: 10 },
  tabButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: C.card, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: "center" },
  tabButtonActive: { backgroundColor: C.accent, borderColor: C.accent },
  tabButtonText: { fontSize: 14, color: C.dim, fontWeight: "600" },
  tabButtonTextActive: { color: C.bg },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, marginHorizontal: 16, marginBottom: 16, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, color: C.text, fontSize: 14 },
  usersContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  userCard: { backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  userInfo: { flexDirection: "row", marginBottom: 12 },
  profileImage: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.card2, marginRight: 12 },
  userDetails: { flex: 1, justifyContent: "center" },
  usernameRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  username: { fontSize: 18, fontWeight: "bold", color: C.text, marginRight: 6 },
  verifiedBadge: { fontSize: 16 },
  bannedBadge: { backgroundColor: "#FF3232", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  bannedText: { color: "#FFF", fontSize: 11, fontWeight: "bold" },
  email: { fontSize: 14, color: C.dim, marginBottom: 4 },
  infoText: { fontSize: 12, color: C.dim, marginBottom: 2 },
  statusPending: { fontSize: 12, color: "#FFD700", fontWeight: "600", marginTop: 4 },
  statusRejected: { fontSize: 12, color: "#FF3232", marginTop: 4 },
  statusRevoked: { fontSize: 12, color: "#FFD700", marginTop: 4 },
  viewDocButton: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12, backgroundColor: C.card2, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  viewDocText: { color: C.accent, fontSize: 14, marginLeft: 6, fontWeight: "600" },
  actionButtons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionButton: { flex: 1, minWidth: "45%", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  approveButton: { backgroundColor: "#36E3C0" },
  rejectButton: { backgroundColor: "#FF3232" },
  banButton: { backgroundColor: "#FF3232" },
  revokeButton: { backgroundColor: "#FFD700" },
  actionButtonText: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyStateText: { fontSize: 16, color: C.dim },
};
