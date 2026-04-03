import React, { createContext, useContext, useState } from "react";

type ThemeType = "light" | "dark" | "custom";

const lightTheme = {
  background: "#F4F6F6",
  primary: "#2A9D8F",
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
  secondary: "#1F7A70",
  text: "#FFFFFF",
  subText: "#9CA3AF",
  card: "#132E2A",
  border: "#1F3D38",
  white: "#FFFFFF",
};

const customTheme = {
  background: "#F4F6F6",
  primary: "#2A9D8F",   // you can change later
  secondary: "#1F7A70",
  text: "#0F172A",
  subText: "#6B7280",
  card: "#EDEFF0",
  border: "#D1D5DB",
  white: "#FFFFFF",
};

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: any) => {
  const [mode, setMode] = useState<ThemeType>("light");

  const theme =
    mode === "dark"
      ? darkTheme
      : mode === "custom"
      ? customTheme
      : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);