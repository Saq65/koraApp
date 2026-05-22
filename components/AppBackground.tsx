// components/AppBackground.tsx
import React, { ReactNode } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { useTheme } from "../src/theme/ThemeProvider"; // adjust path if needed

type AppBackgroundProps = {
  children: ReactNode;
};

export default function AppBackground({ children }: AppBackgroundProps) {
  const { isDarkMode } = useTheme();

  // Choose image based on theme
  const backgroundImage = isDarkMode
    ? require("../assets/images/bgallpage-dark.png")  
    : require("../assets/images/bgallpage.png");      

  // Optional: adjust overlay opacity/color for dark mode
  const overlayColor = isDarkMode
    ? "rgba(0,0,0,0.3)"   // darker overlay for dark mode
    : "rgba(255,255,255,0.05)"; // light overlay (existing)

  return (
    <View style={styles.base}>
      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={[styles.overlay, { backgroundColor: overlayColor }]} />
        {children}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: "#FFFFFF", // fallback while image loads
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});