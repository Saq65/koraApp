import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AppBackground from "@/components/AppBackground";
import { useTheme } from "../../src/theme/ThemeProvider";
import { getMyComplaints } from "../../src/api/support";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ComplaintStatus = "pending" | "in-review" | "resolved" | "rejected";

interface Complaint {
  _id: string;
  category: string;
  orderId?: string;
  subject: string;
  description: string;
  photoUrl?: string;
  status: ComplaintStatus;
  adminRemarks?: string;
  createdAt: string;
}

type TabKey = "all" | "open" | "closed";

const STATUS_META: Record<
  ComplaintStatus,
  { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: { label: "Pending", color: "#B45309", bg: "#FFF4E5", icon: "time-outline" },
  "in-review": { label: "In Review", color: "#4338CA", bg: "#EEF2FF", icon: "search-outline" },
  resolved: { label: "Resolved", color: "#16A34A", bg: "#F0FDF4", icon: "checkmark-circle-outline" },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEE2E2", icon: "close-circle-outline" },
};

const isOpenStatus = (status: ComplaintStatus) =>
  status === "pending" || status === "in-review";

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

export default function MyComplaintsScreen() {
  const { theme, isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadComplaints = useCallback(async () => {
    try {
      setError("");
      const res = await getMyComplaints();
      if (res.success) {
        setComplaints(res.complaints || []);
      } else {
        setError(res.error || "Could not load your complaints");
      }
    } catch (err: any) {
      setError(err.message || "Could not load your complaints");
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadComplaints();
      setLoading(false);
    })();
  }, [loadComplaints]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadComplaints();
    setRefreshing(false);
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const openCount = complaints.filter((c) => isOpenStatus(c.status)).length;
  const closedCount = complaints.length - openCount;

  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === "open") return isOpenStatus(c.status);
    if (activeTab === "closed") return !isOpenStatus(c.status);
    return true;
  });

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: complaints.length },
    { key: "open", label: "Open", count: openCount },
    { key: "closed", label: "Closed", count: closedCount },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <AppBackground>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Complaints</Text>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: theme.primaryLight }]}
            onPress={() => router.push("/profile-page/raiseComplaintScreen")}
          >
            <Ionicons name="add" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? theme.primary : theme.card,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, { color: active ? "#fff" : theme.text }]}>
                  {tab.label} {tab.count > 0 ? `(${tab.count})` : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerFill}>
            <Ionicons name="alert-circle-outline" size={40} color={theme.subText} />
            <Text style={[styles.emptyText, { color: theme.subText }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                setLoading(true);
                loadComplaints().finally(() => setLoading(false));
              }}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          >
            {filteredComplaints.length === 0 ? (
              <View style={styles.centerFill}>
                <Ionicons name="document-text-outline" size={40} color={theme.subText} />
                <Text style={[styles.emptyText, { color: theme.subText }]}>
                  {activeTab === "all"
                    ? "You haven't raised any complaints yet"
                    : activeTab === "open"
                    ? "No open complaints"
                    : "No closed complaints"}
                </Text>
                {activeTab === "all" && (
                  <TouchableOpacity
                    style={[styles.retryBtn, { backgroundColor: theme.primary }]}
                    onPress={() => router.push("/profile-page/raiseComplaintScreen")}
                  >
                    <Text style={styles.retryBtnText}>Raise a Complaint</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredComplaints.map((item) => {
                const meta = STATUS_META[item.status] || STATUS_META.pending;
                const expanded = expandedId === item._id;
                return (
                  <TouchableOpacity
                    key={item._id}
                    style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                    activeOpacity={0.85}
                    onPress={() => toggleExpand(item._id)}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.category, { color: theme.subText }]}>{item.category}</Text>
                        <Text style={[styles.subject, { color: theme.text }]} numberOfLines={expanded ? undefined : 1}>
                          {item.subject}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon} size={13} color={meta.color} />
                        <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                    </View>

                    <View style={styles.cardMetaRow}>
                      <Text style={[styles.metaText, { color: theme.subText }]}>
                        {formatDate(item.createdAt)}
                      </Text>
                      {item.orderId ? (
                        <Text style={[styles.metaText, { color: theme.subText }]}>
                          {"  •  Order #" + item.orderId}
                        </Text>
                      ) : null}
                    </View>

                    {expanded && (
                      <View style={[styles.expandedBox, { borderTopColor: theme.border }]}>
                        <Text style={[styles.descLabel, { color: theme.subText }]}>Description</Text>
                        <Text style={[styles.descText, { color: theme.text }]}>{item.description}</Text>

                        {item.adminRemarks ? (
                          <>
                            <Text style={[styles.descLabel, { color: theme.subText, marginTop: 12 }]}>
                              Response from KORA
                            </Text>
                            <View style={[styles.remarksBox, { backgroundColor: theme.primaryLight }]}>
                              <Text style={[styles.remarksText, { color: theme.text }]}>{item.adminRemarks}</Text>
                            </View>
                          </>
                        ) : isOpenStatus(item.status) ? (
                          <Text style={[styles.pendingNote, { color: theme.subText }]}>
                            We're on it — you'll be notified once there's an update.
                          </Text>
                        ) : null}
                      </View>
                    )}

                    <View style={styles.expandRow}>
                      <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={theme.subText}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", flex: 1 },
  newBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  tabRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: "600" },

  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, gap: 12 },

  centerFill: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyText: { fontSize: 14, textAlign: "center" },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, marginTop: 4 },
  retryBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  category: { fontSize: 11.5, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 3 },
  subject: { fontSize: 15, fontWeight: "700" },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { fontSize: 11.5, fontWeight: "700" },

  cardMetaRow: { flexDirection: "row", marginTop: 8 },
  metaText: { fontSize: 12 },

  expandedBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  descLabel: { fontSize: 11.5, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 },
  descText: { fontSize: 14, lineHeight: 20 },
  remarksBox: { borderRadius: 10, padding: 10, marginTop: 4 },
  remarksText: { fontSize: 14, lineHeight: 20 },
  pendingNote: { fontSize: 13, fontStyle: "italic", marginTop: 10 },

  expandRow: { alignItems: "center", marginTop: 6 },
});