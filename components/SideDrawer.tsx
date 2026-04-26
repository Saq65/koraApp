import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function SideDrawer({ visible, onClose, theme }: any) {
  const translateX = useRef(new Animated.Value(-width)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -width,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: theme.background,
            transform: [{ translateX }],
          },
        ]}
      >
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <LinearGradient
            colors={theme.gradient || [theme.primary, theme.primary]}
            style={styles.drawerHeader}
          >
            <View style={styles.profile}>
              <Ionicons name="person-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.name}>John Doe</Text>
            <Text style={styles.phone}>+91 98765 43210</Text>
            <TouchableOpacity style={styles.close} onPress={onClose}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {[
            "Profile Details",
            "My Services",
            "Refer & Earn",
            "Rewards",
            "Settings",
            "Support",
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.item}>
              <Text style={{ color: theme.text }}>{item}</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.subText} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.logout}>
            <Text style={{ color: "red", fontWeight: "600" }}>Log Out</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    zIndex: 1000,
    elevation: 10,
  },
  drawer: {
    width: "75%",
    height: "100%",
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  drawerHeader: {
    padding: 20,
    paddingTop: 30,
  },
  profile: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  phone: {
    color: "#fff",
    fontSize: 12,
  },
  close: {
    position: "absolute",
    right: 15,
    top: 15,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  logout: {
    marginTop: 20,
    padding: 16,
  },
});