// screens/ReportsDashboardScreen.js
// Admin Reports Dashboard - View and manage user reports

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { s } from "../styles/styles";
import { C } from "../components/Theme";
import {
  getReports,
  getReportStats,
  subscribeToReports,
  REPORT_STATUS,
  REPORT_PRIORITY,
  REPORT_TYPES,
  getPriorityColor,
  getStatusColor,
  formatTimestamp,
} from "../services/reportService";

export default function ReportsDashboardScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("pending");
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);

  useEffect(() => {
    fetchData();
    
    // Set up real-time listener for pending reports
    const unsubscribe = subscribeToReports(
      { status: statusFilter, priority: priorityFilter },
      (updatedReports) => {
        setReports(updatedReports);
      }
    );
    
    return () => unsubscribe && unsubscribe();
  }, [statusFilter, priorityFilter, typeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportsData, statsData] = await Promise.all([
        getReports({
          status: statusFilter,
          priority: priorityFilter,
          reportType: typeFilter,
        }),
        getReportStats(),
      ]);
      setReports(reportsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [statusFilter, priorityFilter, typeFilter]);

  const filteredReports = reports.filter((report) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.reportedUsername?.toLowerCase().includes(query) ||
      report.reporterUsername?.toLowerCase().includes(query) ||
      report.reasonLabel?.toLowerCase().includes(query) ||
      report.description?.toLowerCase().includes(query)
    );
  });

  const renderStatCard = (title, value, color, gradient) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}
      onPress={() => {
        if (title === "Pending") setStatusFilter("pending");
        else if (title === "Under Review") setStatusFilter("under_review");
        else if (title === "Resolved") setStatusFilter("resolved");
        else if (title === "Action Taken") setStatusFilter("action_taken");
        else setStatusFilter(null);
      }}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const renderPriorityBadge = (priority) => {
    const color = getPriorityColor(priority);
    return (
      <View style={[styles.priorityBadge, { backgroundColor: color + "20" }]}>
        <View style={[styles.priorityDot, { backgroundColor: color }]} />
        <Text style={[styles.priorityText, { color }]}>
          {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
        </Text>
      </View>
    );
  };

  const renderStatusBadge = (status) => {
    const color = getStatusColor(status);
    const label = status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    return (
      <View style={[styles.statusBadge, { backgroundColor: color + "20" }]}>
        <Text style={[styles.statusText, { color }]}>{label}</Text>
      </View>
    );
  };

  const renderReportCard = (report) => (
    <TouchableOpacity
      key={report.id}
      style={styles.reportCard}
      onPress={() => navigation.navigate("ReportDetail", { reportId: report.id })}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportHeaderLeft}>
          {renderPriorityBadge(report.priority)}
          {renderStatusBadge(report.status)}
        </View>
        <Text style={styles.reportTime}>{formatTimestamp(report.createdAt)}</Text>
      </View>
      
      <View style={styles.reportBody}>
        <View style={styles.reportUsers}>
          <View style={styles.userInfo}>
            <Ionicons name="person-circle" size={20} color={C.dim} />
            <Text style={styles.reportedUser} numberOfLines={1}>
              {report.reportedUsername || "Unknown User"}
            </Text>
          </View>
          <Text style={styles.reportedBy}>
            reported by @{report.reporterUsername || "unknown"}
          </Text>
        </View>
        
        <View style={styles.reportReason}>
          <MaterialIcons name="report" size={16} color="#EF4444" />
          <Text style={styles.reasonText}>{report.reasonLabel}</Text>
        </View>
        
        {report.description ? (
          <Text style={styles.reportDescription} numberOfLines={2}>
            {report.description}
          </Text>
        ) : null}
        
        <View style={styles.reportFooter}>
          <View style={styles.reportType}>
            <Ionicons
              name={getTypeIcon(report.reportType)}
              size={14}
              color={C.dim}
            />
            <Text style={styles.reportTypeText}>
              {report.reportType?.charAt(0).toUpperCase() + report.reportType?.slice(1)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.dim} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const getTypeIcon = (type) => {
    switch (type) {
      case "user": return "person";
      case "post": return "document-text";
      case "comment": return "chatbubble";
      case "message": return "mail";
      case "community": return "people";
      case "product": return "cart";
      case "story": return "images";
      default: return "alert-circle";
    }
  };

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <Pressable
        style={styles.modalBackdrop}
        onPress={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Filter Reports</Text>
          
          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.filterOptions}>
            {[
              { value: null, label: "All" },
              { value: "pending", label: "Pending" },
              { value: "under_review", label: "Under Review" },
              { value: "resolved", label: "Resolved" },
              { value: "action_taken", label: "Action Taken" },
              { value: "dismissed", label: "Dismissed" },
            ].map((option) => (
              <TouchableOpacity
                key={option.value || "all"}
                style={[
                  styles.filterChip,
                  statusFilter === option.value && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(option.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === option.value && styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.filterLabel}>Priority</Text>
          <View style={styles.filterOptions}>
            {[
              { value: null, label: "All" },
              { value: "high", label: "High", color: "#EF4444" },
              { value: "medium", label: "Medium", color: "#F59E0B" },
              { value: "low", label: "Low", color: "#6B7280" },
            ].map((option) => (
              <TouchableOpacity
                key={option.value || "all"}
                style={[
                  styles.filterChip,
                  priorityFilter === option.value && styles.filterChipActive,
                  option.color && { borderColor: option.color },
                ]}
                onPress={() => setPriorityFilter(option.value)}
              >
                {option.color && (
                  <View
                    style={[styles.priorityDot, { backgroundColor: option.color }]}
                  />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    priorityFilter === option.value && styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.filterLabel}>Report Type</Text>
          <View style={styles.filterOptions}>
            {[
              { value: null, label: "All" },
              { value: "user", label: "User" },
              { value: "post", label: "Post" },
              { value: "comment", label: "Comment" },
              { value: "message", label: "Message" },
              { value: "community", label: "Community" },
            ].map((option) => (
              <TouchableOpacity
                key={option.value || "all"}
                style={[
                  styles.filterChip,
                  typeFilter === option.value && styles.filterChipActive,
                ]}
                onPress={() => setTypeFilter(option.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    typeFilter === option.value && styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setStatusFilter("pending");
                setPriorityFilter(null);
                setTypeFilter(null);
              }}
            >
              <Text style={styles.clearButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
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
        <Text style={{ color: C.dim, marginTop: 12 }}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports Dashboard</Text>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
          <Ionicons name="filter" size={24} color={C.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        }
      >
        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {renderStatCard("Pending", stats.pending, "#F59E0B")}
              {renderStatCard("High Priority", stats.highPriority, "#EF4444")}
              {renderStatCard("Under Review", stats.underReview, "#3B82F6")}
              {renderStatCard("Action Taken", stats.actionTaken, "#8B5CF6")}
              {renderStatCard("Total", stats.total, C.accent)}
            </ScrollView>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={C.dim} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search reports..."
              placeholderTextColor={C.dim}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={C.dim} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Active Filters */}
        {(statusFilter || priorityFilter || typeFilter) && (
          <View style={styles.activeFilters}>
            <Text style={styles.activeFiltersLabel}>Filters:</Text>
            {statusFilter && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  {statusFilter.replace(/_/g, " ")}
                </Text>
                <TouchableOpacity onPress={() => setStatusFilter(null)}>
                  <Ionicons name="close" size={14} color={C.text} />
                </TouchableOpacity>
              </View>
            )}
            {priorityFilter && (
              <View style={styles.activeFilterChip}>
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: getPriorityColor(priorityFilter) },
                  ]}
                />
                <Text style={styles.activeFilterText}>{priorityFilter}</Text>
                <TouchableOpacity onPress={() => setPriorityFilter(null)}>
                  <Ionicons name="close" size={14} color={C.text} />
                </TouchableOpacity>
              </View>
            )}
            {typeFilter && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{typeFilter}</Text>
                <TouchableOpacity onPress={() => setTypeFilter(null)}>
                  <Ionicons name="close" size={14} color={C.text} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Reports List */}
        <View style={styles.reportsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {statusFilter
                ? statusFilter.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                : "All"}{" "}
              Reports
            </Text>
            <Text style={styles.sectionCount}>{filteredReports.length}</Text>
          </View>

          {filteredReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color={C.accent} />
              <Text style={styles.emptyTitle}>No Reports</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No reports match your search"
                  : "No reports with the selected filters"}
              </Text>
            </View>
          ) : (
            filteredReports.map(renderReportCard)
          )}
        </View>
      </ScrollView>

      {renderFilterModal()}
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
  statsContainer: {
    paddingVertical: 16,
    paddingLeft: 16,
  },
  statCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: C.border,
  },
  statValue: {
    color: C.text,
    fontSize: 28,
    fontWeight: "700",
  },
  statTitle: {
    color: C.dim,
    fontSize: 13,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    marginLeft: 8,
    fontSize: 15,
  },
  activeFilters: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  activeFiltersLabel: {
    color: C.dim,
    fontSize: 13,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.accent + "20",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterText: {
    color: C.text,
    fontSize: 12,
    textTransform: "capitalize",
  },
  reportsSection: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "600",
  },
  sectionCount: {
    color: C.dim,
    fontSize: 14,
  },
  reportCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.card2,
  },
  reportHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reportTime: {
    color: C.dim,
    fontSize: 12,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  reportBody: {
    padding: 12,
  },
  reportUsers: {
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reportedUser: {
    color: C.text,
    fontSize: 15,
    fontWeight: "600",
  },
  reportedBy: {
    color: C.dim,
    fontSize: 12,
    marginTop: 2,
    marginLeft: 26,
  },
  reportReason: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  reasonText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "500",
  },
  reportDescription: {
    color: C.dim,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  reportFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  reportType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reportTypeText: {
    color: C.dim,
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyText: {
    color: C.dim,
    fontSize: 14,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
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
  },
  modalTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  filterLabel: {
    color: C.dim,
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 12,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: C.accent + "20",
    borderColor: C.accent,
  },
  filterChipText: {
    color: C.dim,
    fontSize: 13,
  },
  filterChipTextActive: {
    color: C.text,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },
  clearButtonText: {
    color: C.dim,
    fontSize: 14,
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: "center",
  },
  applyButtonText: {
    color: C.bg,
    fontSize: 14,
    fontWeight: "600",
  },
};
