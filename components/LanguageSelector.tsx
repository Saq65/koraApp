import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { useTheme } from "../src/theme/ThemeProvider";
import { loadLanguage } from "../src/translations/i18n";

const LANGUAGES = [
  { label: "EN", value: "en" },
  { label: "हि", value: "hi" },
  { label: "मर", value: "mr" },
  { label: "ગુ", value: "gu" },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const [selected, setSelected] = useState(i18n.language || "en");

  useEffect(() => {
    const loadSaved = async () => {
      const saved =
        (await AsyncStorage.getItem("app-language")) ||
        (await AsyncStorage.getItem("selectedLanguage")) ||
        i18n.language ||
        "en";
      setSelected(saved);
    };

    loadSaved();

    const onLanguageChanged = (lng: string) => {
      setSelected(lng);
    };

    i18n.on("languageChanged", onLanguageChanged);
    return () => {
      i18n.off("languageChanged", onLanguageChanged);
    };
  }, [i18n]);

  const handleChange = async (item: { label: string; value: string }) => {
    if (!item?.value) return;
    setSelected(item.value);
    await loadLanguage(item.value);
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Ionicons name="language-outline" size={15} color={theme.primary} style={styles.langIcon} />
      <Dropdown
        style={styles.dropdown}
        selectedTextStyle={[styles.selectedText, { color: theme.text }]}
        itemTextStyle={[styles.itemText, { color: theme.text }]}
        itemContainerStyle={{ backgroundColor: theme.card }}
        containerStyle={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}
        activeColor={theme.primaryLight}
        data={LANGUAGES}
        labelField="label"
        valueField="value"
        value={selected}
        onChange={handleChange}
        showsVerticalScrollIndicator={false}
        renderRightIcon={() => (
          <Ionicons name="chevron-down" size={13} color={theme.subText} style={styles.chevron} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    paddingLeft: 8,
    paddingRight: 4,
  },
  langIcon: {
    marginRight: 4,
  },
  dropdown: {
    width: 46,
    height: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  chevron: {
    marginLeft: 2,
  },
  selectedText: {
    fontSize: 13,
    fontWeight: "700",
    includeFontPadding: false,
  },
  itemText: {
    fontSize: 13,
    fontWeight: "600",
  },
  container: {
    width: 90,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
});