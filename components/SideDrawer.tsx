import React, { useEffect, useRef, useState } from "react";
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
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { getUser, clearAll } from "../src/utils/storage"; // adjust path

const { width } = Dimensions.get("window");

export default function SideDrawer({ visible, onClose, theme }: any) {
  const translateX = useRef(new Animated.Value(-width)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const { t } = useTranslation();
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");

  // Load user data when drawer becomes visible
  useEffect(() => {
    if (visible) {
      const loadUser = async () => {
        const user = await getUser();
        if (user) {
          setUserName(user.name || "User");
          setUserPhone(user.mobile || "");
        }
      };
      loadUser();
    }
  }, [visible]);

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

  const handleLogout = async () => {
    await clearAll();
    onClose(); // close drawer
    router.replace("/(auth)/email-login");
  };

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
            <Text style={styles.name}>{userName || "Guest"}</Text>
            <Text style={styles.phone}>{userPhone || ""}</Text>
            <TouchableOpacity style={styles.close} onPress={onClose}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {[
            { labelKey: "side_drawer.personal_details", route: "/profile-page/personal-details" },
            { labelKey: "side_drawer.my_services", route: "/(tabs)/orders" },
            { labelKey: "side_drawer.refer_earn", route: "/refer" },
            { labelKey: "side_drawer.rewards", route: "/rewards" },
            { labelKey: "side_drawer.settings", route: "/settings" },
            { labelKey: "side_drawer.support", route: "/support" },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.item}
              onPress={() => {
                onClose();
                router.push(item.route as any);
              }}
            >
              <Text style={{ color: theme.text }}>{t(item.labelKey)}</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.subText} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.logout} onPress={handleLogout}>
            <Text style={{ color: "red", fontWeight: "600" }}>{t("profile.logout")}</Text>
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