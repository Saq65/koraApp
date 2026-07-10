import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "app-theme-mode";

type ThemeType = "light" | "dark" | "custom";

const lightTheme = {
  background: "#F4F6F6",
  primary: "#2A9D8F",
  primaryLight: "#E6F4F1",  // Added for icon background
  secondary: "#1F7A70",
  text: "#0F172A",
  subText: "#6B7280",
  card: "#EDEFF0",
  border: "#D1D5DB",
  white: "#FFFFFF",
};

const darkTheme = {
  background: "#0B1F1A",
  primary: "#2A9D8F",
  primaryLight: "#1A3A32",  // Added for icon background
  secondary: "#1F7A70",
  text: "#FFFFFF",
  subText: "#9CA3AF",
  card: "#132E2A",
  border: "#1F3D38",
  white: "#FFFFFF",
};

const customTheme = {
  background: "#F4F6F6",
  primary: "#2A9D8F",
  primaryLight: "#E6F4F1",
  secondary: "#1F7A70",
  text: "#0F172A",
  subText: "#6B7280",
  card: "#EDEFF0",
  border: "#D1D5DB",
  white: "#FFFFFF",
};

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: any) => {
  const [mode, setModeState] = useState<ThemeType>("light");

  // Load the saved theme once when the app starts, so it doesn't
  // reset to light every time the app is reopened fresh.
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "custom") {
        setModeState(saved);
      }
    });
  }, []);

  // Wrap setMode so any change (including via setMode directly) is persisted
  const setMode = (next: ThemeType) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
  };

  // Helper to toggle between light and dark
  const toggleTheme = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  const isDarkMode = mode === "dark";

  const theme =
    mode === "dark"
      ? darkTheme
      : mode === "custom"
      ? customTheme
      : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        setMode,
        isDarkMode,    
        toggleTheme,   
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);