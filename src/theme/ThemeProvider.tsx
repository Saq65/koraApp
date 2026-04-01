import React, { createContext, useContext, useState } from "react";

const lightTheme = {
  background: "#F5F7FB",
  primary: "#6C63FF",
  text: "#111",
  subText: "#666",
  card: "#FFF",
};

const darkTheme = {
  background: "#0F172A",
  primary: "#8B5CF6",
  text: "#FFF",
  subText: "#AAA",
  card: "#1E293B",
};

const customTheme = {
  background: "#FFF7ED",
  primary: "#F97316",
  text: "#111",
  subText: "#777",
  card: "#FFF",
};

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: any) => {
  const [mode, setMode] = useState<"light" | "dark" | "custom">("light");

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