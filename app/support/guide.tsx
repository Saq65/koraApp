import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import AppBackground from "@/components/AppBackground";
import { useTheme } from "../../src/theme/ThemeProvider";

type GuideSection = {
  title: string;
  dos: string[];
  donts: string[];
};

const SECTIONS: GuideSection[] = [
  {
    title: "support.guide.places.title",
    dos: [
      "support.guide.places.do_1",
      "support.guide.places.do_2",
      "support.guide.places.do_3",
      "support.guide.places.do_4",
    ],
    donts: [
      "support.guide.places.dont_1",
      "support.guide.places.dont_2",
    ],
  },
  {
    title: "support.guide.pickup.title",
    dos: [
      "support.guide.pickup.do_1",
      "support.guide.pickup.do_2",
      "support.guide.pickup.do_3",
    ],
    donts: [
      "support.guide.pickup.dont_1",
      "support.guide.pickup.dont_2",
    ],
  },
  {
    title: "support.guide.cancellations.title",
    dos: [
      "support.guide.cancellations.do_1",
      "support.guide.cancellations.do_2",
      "support.guide.cancellations.do_3",
    ],
    donts: [
      "support.guide.cancellations.dont_1",
      "support.guide.cancellations.dont_2",
      "support.guide.cancellations.dont_3",
    ],
  },
  {
    title: "support.guide.payments.title",
    dos: [
      "support.guide.payments.do_1",
      "support.guide.payments.do_2",
    ],
    donts: [
      "support.guide.payments.dont_1",
    ],
  },
  {
    title: "support.guide.account.title",
    dos: [
      "support.guide.account.do_1",
      "support.guide.account.do_2",
    ],
    donts: [
      "support.guide.account.dont_1",
      "support.guide.account.dont_2",
    ],
  },
];

export default function UserGuideScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <AppBackground>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t("support.guide_title")}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.intro, { color: theme.subText }]}> 
            {t("support.guide_intro")}
          </Text>

          {SECTIONS.map((section) => (
            <View key={section.title} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}> 
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t(section.title)}</Text>

              {section.dos.map((line, i) => (
                <View key={`do-${i}`} style={styles.itemRow}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.primary} style={styles.itemIcon} />
                  <Text style={[styles.itemText, { color: theme.text }]}>{t(line)}</Text>
                </View>
              ))}

              {section.donts.map((line, i) => (
                <View key={`dont-${i}`} style={styles.itemRow}>
                  <Ionicons name="close-circle" size={18} color="#E53935" style={styles.itemIcon} />
                  <Text style={[styles.itemText, { color: theme.text }]}>{t(line)}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40, gap: 14 },
  intro: { fontSize: 13.5, lineHeight: 19, marginBottom: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 15.5, fontWeight: "700", marginBottom: 2 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  itemIcon: { marginTop: 1 },
  itemText: { fontSize: 13.5, lineHeight: 19, flex: 1 },
});