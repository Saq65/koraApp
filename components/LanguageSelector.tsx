import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { label: "EN", value: "en" },
  { label: "हि", value: "hi" },
  { label: "मर", value: "mr" },
  { label: "ગુ", value: "gu" },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [selected, setSelected] = useState("en");

  // Load saved language on mount
  useEffect(() => {
    AsyncStorage.getItem("app-language").then((saved) => {
      if (saved) setSelected(saved);
    });
  }, []);

  const handleChange = async (item: { label: string; value: string }) => {
    if (!item?.value) return;             // ← guard against undefined crash
    setSelected(item.value);
    await AsyncStorage.setItem("app-language", item.value);
    await i18n.changeLanguage(item.value);
  };

  return (
    <Dropdown
      style={styles.dropdown}
      selectedTextStyle={styles.selectedText}
      itemTextStyle={styles.itemText}
      containerStyle={styles.container}
      data={LANGUAGES}
      labelField="label"
      valueField="value"
      value={selected}
      onChange={handleChange}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  dropdown: {
    width: 52,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 8,
  },
  selectedText: {
    fontSize: 13,
    fontWeight: "700",
  },
  itemText: {
    fontSize: 13,
    fontWeight: "600",
  },
  container: {
    width: 80,
    borderRadius: 10,
  },
});