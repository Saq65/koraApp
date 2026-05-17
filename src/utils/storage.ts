// utils/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── TOKEN ──────────────────────────────────────────
export const setToken = async (token: string) => {
  await AsyncStorage.setItem("token", token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem("token");
};

export const removeToken = async () => {
  await AsyncStorage.removeItem("token");
};

// ─── USER (full profile) ───────────────────────────
export const setUser = async (user: any) => {
  await AsyncStorage.setItem("user", JSON.stringify(user));
};

export const getUser = async () => {
  const userStr = await AsyncStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

export const removeUser = async () => {
  await AsyncStorage.removeItem("user");
};

// ─── CLEAR ALL (on logout) ─────────────────────────
export const clearAll = async () => {
  await removeToken();
  await removeUser();
};