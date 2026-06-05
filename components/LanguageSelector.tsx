import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, Modal, FlatList, StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../src/theme/ThemeProvider";
import i18n from "../src/translations/i18n";

const LANGUAGES = [
  { code: "en", nativeLabel: "English" },
  { code: "hi", nativeLabel: "हिन्दी" },
  { code: "mr", nativeLabel: "मराठी" },
  { code: "gu", nativeLabel: "ગુજરાતી" },
];

export default function LanguageSelector() {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);

  const currentLabel =
    LANGUAGES.find((l) => l.code === i18n.language)?.nativeLabel ?? "English";

  const changeLanguage = async (code: string) => {
    await i18n.changeLanguage(code);
    await AsyncStorage.setItem("app-language", code);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: theme.card, borderColor: theme.border ?? "#ddd" }]}
        onPress={() => setVisible(true)}
      >
        <Ionicons name="language-outline" size={16} color={theme.primary} />
        <Text style={[styles.btnText, { color: theme.primary }]}>{currentLabel}</Text>
        <Ionicons name="chevron-down" size={14} color={theme.primary} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border ?? "#ddd" }]}>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => changeLanguage(item.code)}
                >
                  <Text style={[styles.itemText, { color: theme.text }]}>{item.nativeLabel}</Text>
                  {i18n.language === item.code && (
                    <Ionicons name="checkmark" size={16} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  btnText: { fontSize: 13, fontWeight: "500" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdown: {
    width: 190,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  itemText: { fontSize: 15 },
});