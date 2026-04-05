import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  
} from "react-native";
import { useTheme } from "../../src/theme/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { theme } = useTheme();

  return (

    <SafeAreaView style={{ flex: 1}} edges={["top"]}>

    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.subText }]}>
            Welcome 👋
          </Text>
          <Text style={[styles.name, { color: theme.text }]}>
            KORA User
          </Text>
        </View>

        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>K</Text>
        </View>
      </View>

      {/* MAIN CARD */}
      <LinearGradient
        colors={theme.gradient || [theme.primary, theme.primary]}
        style={styles.mainCard}
      >
        <Text style={styles.mainTitle}>Schedule Pickup</Text>
        <Text style={styles.mainSubtitle}>
          Get your laundry picked up at your doorstep
        </Text>

        <TouchableOpacity style={styles.mainBtn}>
          <Text style={styles.mainBtnText}>Book Now</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* SERVICES */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Our Services
      </Text>

      <View style={styles.serviceRow}>
        <ServiceCard
          icon="shirt-outline"
          title="Wash"
          theme={theme}
        />
        <ServiceCard
          icon="flame-outline"
          title="Dry Clean"
          theme={theme}
        />
      </View>

      <View style={styles.serviceRow}>
        <ServiceCard
          icon="water-outline"
          title="Premium"
          theme={theme}
        />
        <ServiceCard
          icon="time-outline"
          title="Express"
          theme={theme}
        />
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

// 🔹 Service Card Component
const ServiceCard = ({ icon, title, theme }: any) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
        },
      ]}
    >
      <Ionicons name={icon} size={26} color={theme.primary} />
      <Text style={{ color: theme.text, marginTop: 10 }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  greeting: {
    fontSize: 14,
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  mainCard: {
    marginTop: 25,
    padding: 20,
    borderRadius: 20,
  },

  mainTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  mainSubtitle: {
    color: "#fff",
    marginTop: 5,
  },

  mainBtn: {
    marginTop: 15,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    alignSelf: "flex-start",
  },

  mainBtnText: {
    color: "#000",
    fontWeight: "600",
  },

  sectionTitle: {
    marginTop: 25,
    fontSize: 18,
    fontWeight: "600",
  },

  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  card: {
    width: "48%",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
});