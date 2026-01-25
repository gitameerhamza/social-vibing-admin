// screens/ReportDetailScreen.js
// Detailed view of a single report with action options

import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Pressable,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { s } from "../styles/styles";
import { C } from "../components/Theme";
import { auth } from "../firebaseConfig";
import {
  getReportById,
  takeActionOnReport,
  dismissReport,
  updateReportStatus,
  addAdminNotes,
  getUserReportHistory,
  REPORT_STATUS,
  ADMIN_ACTIONS,
  getPriorityColor,
  getStatusColor,
  formatTimestamp,
  REPORT_REASONS,
} from "../services/reportService";

export default function ReportDetailScreen({ navigation, route }) {
  const { reportId } = route.params;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [userHistory, setUserHistory] = useState([]);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionReason, setActionReason] = useState("");
  const [banDuration, setBanDuration] = useState("7");
  const [warningMessage, setWarningMessage] = useState("");

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const reportData = await getReportById(reportId);
      setReport(reportData);
      setAdminNotes(reportData?.adminNotes || "");
      
      if (reportData?.reportedId) {
        const history = await getUserReportHistory(reportData.reportedId);
        setUserHistory(history);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      Alert.alert("Error", "Failed to load report details");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkUnderReview = async () => {
    try {
      setActionLoading(true);
      await updateReportStatus(reportId, REPORT_STATUS.UNDER_REVIEW, auth.currentUser?.uid);
      await fetchReport();
      Alert.alert("Success", "Report marked as under review");
    } catch (error) {
      Alert.alert("Error", "Failed to update report status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await addAdminNotes(reportId, adminNotes);
      Alert.alert("Success", "Notes saved");
    } catch (error) {
      Alert.alert("Error", "Failed to save notes");
    }
  };

  const handleDismiss = () => {
    Alert.alert(
      "Dismiss Report",
      "Are you sure you want to dismiss this report? This indicates no violation was found.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Dismiss",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              await dismissReport(reportId, auth.currentUser?.uid, adminNotes);
              Alert.alert("Success", "Report dismissed");
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to dismiss report");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleTakeAction = async () => {
    if (!selectedAction) {
      Alert.alert("Error", "Please select an action");
      return;
    }

    const actionDetails = {
      reason: actionReason,
    };

    if (selectedAction === ADMIN_ACTIONS.WARNING) {
      actionDetails.message = warningMessage || "You have received a warning for violating community guidelines.";
    } else if (selectedAction === ADMIN_ACTIONS.TEMPORARY_BAN) {
      actionDetails.duration = parseInt(banDuration) || 7;
    }

    try {
      setActionLoading(true);
      await takeActionOnReport(reportId, {
        action: selectedAction,
        actionDetails,
        adminId: auth.currentUser?.uid,
      });
      setActionModalVisible(false);
      Alert.alert("Success", "Action taken successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error taking action:", error);
      Alert.alert(
        "Error", 
        error.message || "Failed to take action. Make sure you have admin permissions."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const renderActionModal = () => (
    <Modal
      visible={actionModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setActionModalVisible(false)}
    >
      <Pressable
        style={styles.modalBackdrop}
        onPress={() => setActionModalVisible(false)}
      >
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Take Action</Text>
          
          <Text style={styles.filterLabel}>Select Action</Text>
          <View style={styles.actionOptions}>
            {[
              { value: ADMIN_ACTIONS.WARNING, label: "Issue Warning", icon: "alert-circle", color: "#F59E0B" },
              { value: ADMIN_ACTIONS.TEMPORARY_BAN, label: "Temporary Ban", icon: "time", color: "#EF4444" },
              { value: ADMIN_ACTIONS.PERMANENT_BAN, label: "Permanent Ban", icon: "ban", color: "#DC2626" },
              { value: ADMIN_ACTIONS.ACCOUNT_SUSPENDED, label: "Suspend Account", icon: "pause-circle", color: "#8B5CF6" },
              { value: ADMIN_ACTIONS.CONTENT_REMOVED, label: "Remove Content", icon: "trash", color: "#6B7280" },
            ].map((action) => (
              <TouchableOpacity
                key={action.value}
                style={[
                  styles.actionOption,
                  selectedAction === action.value && styles.actionOptionActive,
                  { borderColor: action.color },
                ]}
                onPress={() => setSelectedAction(action.value)}
              >
                <Ionicons name={action.icon} size={20} color={action.color} />
                <Text style={[styles.actionOptionText, { color: action.color }]}>
                  {action.label}
                </Text>
                {selectedAction === action.value && (
                  <Ionicons name="checkmark-circle" size={18} color={C.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedAction === ADMIN_ACTIONS.WARNING && (
            <>
              <Text style={styles.filterLabel}>Warning Message</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter warning message for user..."
                placeholderTextColor={C.dim}
                value={warningMessage}
                onChangeText={setWarningMessage}
                multiline
                numberOfLines={3}
              />
            </>
          )}

          {selectedAction === ADMIN_ACTIONS.TEMPORARY_BAN && (
            <>
              <Text style={styles.filterLabel}>Ban Duration (days)</Text>
              <View style={styles.durationOptions}>
                {["1", "3", "7", "14", "30"].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.durationChip,
                      banDuration === days && styles.durationChipActive,
                    ]}
                    onPress={() => setBanDuration(days)}
                  >
                    <Text
                      style={[
                        styles.durationChipText,
                        banDuration === days && styles.durationChipTextActive,
                      ]}
                    >
                      {days} days
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.filterLabel}>Reason for Action</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Enter reason for taking this action..."
            placeholderTextColor={C.dim}
            value={actionReason}
            onChangeText={setActionReason}
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setActionModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, !selectedAction && styles.confirmButtonDisabled]}
              onPress={handleTakeAction}
              disabled={!selectedAction || actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={C.bg} />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Action</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[s.center, { flex: 1, backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={{ color: C.dim, marginTop: 12 }}>Loading report...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[s.center, { flex: 1, backgroundColor: C.bg }]}>
        <Ionicons name="alert-circle" size={48} color={C.dim} />
        <Text style={{ color: C.text, fontSize: 18, marginTop: 12 }}>Report not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const priorityColor = getPriorityColor(report.priority);
  const statusColor = getStatusColor(report.status);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusColor + "20" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusBannerText, { color: statusColor }]}>
            {report.status?.replace(/_/g, " ").toUpperCase()}
          </Text>
          <Text style={styles.statusTime}>
            {report.isResolved ? "Resolved" : "Open"} • {formatTimestamp(report.createdAt)}
          </Text>
        </View>

        {/* Priority & Type */}
        <View style={styles.metaRow}>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + "20" }]}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {report.priority?.toUpperCase()} PRIORITY
            </Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {report.reportType?.toUpperCase()} REPORT
            </Text>
          </View>
        </View>

        {/* Reported User Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reported User</Text>
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={28} color={C.dim} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{report.reportedUsername || "Unknown"}</Text>
              <Text style={styles.userId}>ID: {report.reportedId}</Text>
              {userHistory.length > 1 && (
                <View style={styles.historyBadge}>
                  <MaterialIcons name="warning" size={14} color="#F59E0B" />
                  <Text style={styles.historyText}>
                    {userHistory.length} total reports
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Reporter Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reported By</Text>
          <View style={styles.reporterRow}>
            <Ionicons name="person-circle" size={20} color={C.dim} />
            <Text style={styles.reporterName}>@{report.reporterUsername || "unknown"}</Text>
            <Text style={styles.reporterTime}>{formatTimestamp(report.createdAt)}</Text>
          </View>
        </View>

        {/* Reason Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Reason</Text>
          <View style={styles.reasonCard}>
            <View style={styles.reasonHeader}>
              <MaterialIcons name="report" size={20} color="#EF4444" />
              <Text style={styles.reasonLabel}>{report.reasonLabel}</Text>
            </View>
            <View style={styles.reasonCategory}>
              <Text style={styles.categoryText}>
                Category: {report.reasonCategory?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {report.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{report.description}</Text>
            </View>
          </View>
        )}

        {/* Content Preview */}
        {report.contentPreview && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reported Content</Text>
            <View style={styles.contentCard}>
              <Text style={styles.contentTypeLabel}>
                {report.contentType?.toUpperCase()}
              </Text>
              <Text style={styles.contentPreview}>{report.contentPreview}</Text>
              {report.contentId && (
                <Text style={styles.contentId}>Content ID: {report.contentId}</Text>
              )}
            </View>
          </View>
        )}

        {/* Evidence */}
        {report.evidence && report.evidence.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidence ({report.evidence.length})</Text>
            <View style={styles.evidenceList}>
              {report.evidence.map((url, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.evidenceItem}
                  onPress={() => Linking.openURL(url)}
                >
                  <Ionicons name="attach" size={18} color={C.accent} />
                  <Text style={styles.evidenceText} numberOfLines={1}>
                    Evidence {index + 1}
                  </Text>
                  <Ionicons name="open-outline" size={16} color={C.dim} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* User Report History */}
        {userHistory.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              User Report History ({userHistory.length})
            </Text>
            <View style={styles.historyList}>
              {userHistory.slice(0, 5).map((hist) => (
                <View key={hist.id} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <View
                      style={[
                        styles.historyDot,
                        { backgroundColor: getStatusColor(hist.status) },
                      ]}
                    />
                    <Text style={styles.historyReason}>{hist.reasonLabel}</Text>
                  </View>
                  <Text style={styles.historyDate}>
                    {formatTimestamp(hist.createdAt)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Admin Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add internal notes about this report..."
            placeholderTextColor={C.dim}
            value={adminNotes}
            onChangeText={setAdminNotes}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity
            style={styles.saveNotesButton}
            onPress={handleSaveNotes}
          >
            <Text style={styles.saveNotesText}>Save Notes</Text>
          </TouchableOpacity>
        </View>

        {/* Previous Action */}
        {report.actionTaken && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Action Taken</Text>
            <View style={styles.actionTakenCard}>
              <View style={styles.actionTakenHeader}>
                <Ionicons name="checkmark-circle" size={20} color={C.accent} />
                <Text style={styles.actionTakenLabel}>
                  {report.actionTaken?.replace(/_/g, " ").toUpperCase()}
                </Text>
              </View>
              {report.actionDetails?.reason && (
                <Text style={styles.actionTakenReason}>
                  {report.actionDetails.reason}
                </Text>
              )}
              {report.reviewedBy && (
                <Text style={styles.actionTakenAdmin}>
                  by Admin: {report.reviewedBy}
                </Text>
              )}
              <Text style={styles.actionTakenTime}>
                {formatTimestamp(report.reviewedAt)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons (Fixed at bottom) */}
      {!report.isResolved && (
        <View style={styles.actionBar}>
          {report.status === REPORT_STATUS.PENDING && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={handleMarkUnderReview}
              disabled={actionLoading}
            >
              <Ionicons name="eye" size={18} color={C.text} />
              <Text style={styles.reviewButtonText}>Start Review</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            disabled={actionLoading}
          >
            <Ionicons name="close-circle" size={18} color="#6B7280" />
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.takeActionButton}
            onPress={() => setActionModalVisible(true)}
            disabled={actionLoading}
          >
            <Ionicons name="hammer" size={18} color={C.bg} />
            <Text style={styles.takeActionButtonText}>Take Action</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderActionModal()}
    </View>
  );
}

const styles = {
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomColor: C.border,
    borderBottomWidth: 1,
    backgroundColor: C.bg,
  },
  headerTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "700",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: "700",
  },
  statusTime: {
    color: C.dim,
    fontSize: 12,
    marginLeft: "auto",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "700",
  },
  typeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  typeText: {
    color: C.dim,
    fontSize: 11,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    color: C.dim,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.card2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: C.text,
    fontSize: 16,
    fontWeight: "600",
  },
  userId: {
    color: C.dim,
    fontSize: 12,
    marginTop: 2,
  },
  historyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  historyText: {
    color: "#F59E0B",
    fontSize: 12,
  },
  reporterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reporterName: {
    color: C.text,
    fontSize: 14,
  },
  reporterTime: {
    color: C.dim,
    fontSize: 12,
    marginLeft: "auto",
  },
  reasonCard: {
    backgroundColor: C.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reasonLabel: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "600",
  },
  reasonCategory: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  categoryText: {
    color: C.dim,
    fontSize: 12,
  },
  descriptionCard: {
    backgroundColor: C.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  descriptionText: {
    color: C.text,
    fontSize: 14,
    lineHeight: 20,
  },
  contentCard: {
    backgroundColor: C.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  contentTypeLabel: {
    color: C.dim,
    fontSize: 11,
    marginBottom: 6,
  },
  contentPreview: {
    color: C.text,
    fontSize: 14,
    lineHeight: 20,
  },
  contentId: {
    color: C.dim,
    fontSize: 11,
    marginTop: 8,
  },
  evidenceList: {
    gap: 8,
  },
  evidenceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  evidenceText: {
    color: C.accent,
    fontSize: 14,
    flex: 1,
  },
  historyList: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyReason: {
    color: C.text,
    fontSize: 13,
  },
  historyDate: {
    color: C.dim,
    fontSize: 12,
  },
  notesInput: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    color: C.text,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveNotesButton: {
    alignSelf: "flex-end",
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: C.card2,
    borderRadius: 8,
  },
  saveNotesText: {
    color: C.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  actionTakenCard: {
    backgroundColor: C.accent + "10",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.accent + "30",
  },
  actionTakenHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionTakenLabel: {
    color: C.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  actionTakenReason: {
    color: C.text,
    fontSize: 13,
    marginTop: 8,
  },
  actionTakenAdmin: {
    color: C.dim,
    fontSize: 12,
    marginTop: 6,
  },
  actionTakenTime: {
    color: C.dim,
    fontSize: 11,
    marginTop: 4,
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    gap: 10,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  reviewButtonText: {
    color: C.text,
    fontSize: 13,
    fontWeight: "600",
  },
  dismissButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#6B7280",
    backgroundColor: "transparent",
  },
  dismissButtonText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
  },
  takeActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: C.accent,
  },
  takeActionButtonText: {
    color: C.bg,
    fontSize: 14,
    fontWeight: "700",
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: C.accent,
    borderRadius: 10,
  },
  backButtonText: {
    color: C.bg,
    fontSize: 14,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 20,
    borderColor: C.border,
    borderWidth: 1,
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
  },
  modalTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  filterLabel: {
    color: C.dim,
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 16,
  },
  actionOptions: {
    gap: 8,
  },
  actionOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  actionOptionActive: {
    backgroundColor: C.accent + "10",
  },
  actionOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  textArea: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    color: C.text,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  durationOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  durationChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  durationChipActive: {
    backgroundColor: C.accent + "20",
    borderColor: C.accent,
  },
  durationChipText: {
    color: C.dim,
    fontSize: 13,
  },
  durationChipTextActive: {
    color: C.text,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },
  cancelButtonText: {
    color: C.dim,
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: C.bg,
    fontSize: 14,
    fontWeight: "700",
  },
};
