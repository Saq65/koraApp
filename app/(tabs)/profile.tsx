import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme/ThemeProvider";
import { removeToken } from "../../src/utils/storage";
import { router } from "expo-router";

export default function ProfileScreen() {
  const { theme } = useTheme();

  const handleLogout = async () => {
    await removeToken();
    router.replace("/(auth)/login");
  };

  const MenuItem = ({ icon, title, subtitle }: any) => (
    <TouchableOpacity style={styles.menuItem}>
      <View style={styles.menuLeft}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: theme.primaryLight || "#E6F4F1" },
          ]}
        >
          <Ionicons name={icon} size={18} color={theme.primary} />
        </View>

        <View>
          <Text style={[styles.menuText, { color: theme.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{ color: theme.subText, fontSize: 12 }}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.subText} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* HEADER CARD */}
      <View
        style={[
          styles.headerCard,
          { backgroundColor: theme.primary },
        ]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>N</Text>
        </View>

        <Text style={styles.name}>Nikhil Raj</Text>
        <Text style={styles.phone}>+91 98765 43210</Text>
        <Text style={styles.email}>john.doe@email.com</Text>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>₹250</Text>
            <Text style={styles.statLabel}>Wallet</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* MENU */}
      <View style={styles.menuContainer}>
        <MenuItem icon="cube-outline" title="Order History" subtitle="12 orders" />
        <MenuItem icon="card-outline" title="Payment Methods" />
        <MenuItem icon="location-outline" title="Saved Addresses" />
        <MenuItem icon="star-outline" title="Rate Us" />
      </View>

      {/* LOGOUT BUTTON */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  headerCard: {
    padding: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    alignItems: "center",
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ffffff33",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  avatarText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "700",
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },

  phone: {
    color: "#fff",
    marginTop: 5,
  },

  email: {
    color: "#fff",
    fontSize: 12,
    marginBottom: 15,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },

  statBox: {
    alignItems: "center",
    flex: 1,
  },

  statNumber: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  statLabel: {
    color: "#fff",
    fontSize: 12,
  },

  menuContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
  },

  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  menuText: {
    fontSize: 15,
    fontWeight: "500",
  },

  logoutBtn: {
    marginTop: 30,
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 14,
    backgroundColor: "#ff4d4d",
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});