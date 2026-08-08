import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTheme } from "../../src/theme/ThemeProvider";

import {
    getProfile,
    updateProfile,
} from "../../src/services/customer";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "@/components/AppBackground";
import { getUser, setUser } from "../../src/utils/storage"; // add storage helpers
import { useTranslation } from "react-i18next";

export default function PersonalDetailsScreen() {
    const { t } = useTranslation();
    const { theme, isDarkMode } = useTheme();

    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);

    const [profile, setProfile] = useState({
        fullName: "",
        email: "",
        phone: "",
        dob: "",
    });

    // Load from cache instantly, then refresh from API
    const loadProfile = async () => {
        // 1. Instant display from stored user
        const storedUser = await getUser();
        if (storedUser) {
            setProfile({
                fullName: storedUser.name || "",
                email: storedUser.email || "",
                phone: storedUser.mobile || "",
                dob: storedUser.dob || "",
            });
            setLoading(false); // show UI immediately
        }

        // 2. Background refresh from API (for latest data)
        try {
            const response = await getProfile();
            const data = response.data;
            const freshProfile = {
                fullName: data.fullName || storedUser?.name || "",
                email: data.email || storedUser?.email || "",
                phone: data.mobile || storedUser?.mobile || "",
                dob: data.dob ? data.dob.split("T")[0] : "",
            };
            setProfile(freshProfile);
            // Also update stored user with fresh data
            await setUser({
                ...storedUser,
                name: freshProfile.fullName,
                email: freshProfile.email,
                mobile: freshProfile.phone,
                dob: freshProfile.dob,
            });
        } catch (error) {
            console.log("Background refresh error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleUpdate = async () => {
        try {
            const formattedProfile = {
                ...profile,
                dob: profile.dob ? new Date(profile.dob).toISOString() : "",
            };
            await updateProfile(formattedProfile);
            
            // After successful update, refresh stored user data
            const storedUser = await getUser();
            await setUser({
                ...storedUser,
                name: profile.fullName,
                email: profile.email,
                mobile: profile.phone,
                dob: profile.dob,
            });
            
            setEditing(false);
            Alert.alert(t("common.success"), t("personal_details.update_success"));
        } catch (error) {
            console.log("UPDATE ERROR:", error);
            Alert.alert(t("common.error"), t("personal_details.update_failed"));
        }
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <AppBackground>
                <ScrollView
                    style={styles.container}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header with back button and edit/save */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>
                            {t("personal_details.title")}
                        </Text>
                        <TouchableOpacity onPress={() => editing ? handleUpdate() : setEditing(true)}>
                            <Text style={[styles.editText, { color: theme.primary }]}>
                                {editing ? t("common.save") : t("common.edit")}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Profile Section */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                                <Text style={styles.avatarText}>
                                    {profile.fullName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.name, { color: theme.text }]}>
                            {profile.fullName || t("personal_details.default_name")}
                        </Text>
                        <Text style={[styles.username, { color: theme.textSecondary || (isDarkMode ? "#9CA3AF" : "#6B7280") }]}>
                            @{profile.fullName.toLowerCase().replace(/\s/g, '') || t("personal_details.default_username")}
                        </Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.form}>
                        <DetailField
                            label={t("personal_details.full_name")}
                            value={profile.fullName}
                            editable={editing}
                            theme={theme}
                            isDarkMode={isDarkMode}
                            onChangeText={(text: string) => setProfile({ ...profile, fullName: text })}
                        />
                        <DetailField
                            label={t("personal_details.username")}
                            value={`@${profile.fullName.toLowerCase().replace(/\s/g, '')}`}
                            editable={false}
                            theme={theme}
                            isDarkMode={isDarkMode}
                        />
                        <DetailField
                            label={t("personal_details.dob")}
                            value={profile.dob}
                            editable={editing}
                            theme={theme}
                            isDarkMode={isDarkMode}
                            onChangeText={(text: string) => setProfile({ ...profile, dob: text })}
                            placeholder={t("personal_details.dob_placeholder")}
                        />
                        <DetailField
                            label={t("personal_details.mobile")}
                            value={profile.phone}
                            editable={editing}
                            theme={theme}
                            isDarkMode={isDarkMode}
                            onChangeText={(text: string) => setProfile({ ...profile, phone: text })}
                            keyboardType="phone-pad"
                        />
                        <DetailField
                            label={t("personal_details.email")}
                            value={profile.email}
                            editable={editing}
                            theme={theme}
                            isDarkMode={isDarkMode}
                            onChangeText={(text: string) => setProfile({ ...profile, email: text })}
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </AppBackground>
        </SafeAreaView>
    );
}

// Detail field component (unchanged)
function DetailField({ 
    label, 
    value, 
    editable, 
    theme, 
    isDarkMode,
    onChangeText, 
    keyboardType = "default", 
    placeholder = "" 
}: any) {
    return (
        <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary || (isDarkMode ? "#9CA3AF" : "#6B7280") }]}>
                {label}
            </Text>
            {editable ? (
                <TextInput
                    style={[
                        styles.fieldValueInput, 
                        { 
                            color: theme.text,
                            backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB",
                            borderWidth: 1,
                            borderColor: theme.border || (isDarkMode ? "#374151" : "#E5E7EB"),
                        }
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    placeholder={placeholder}
                    placeholderTextColor={theme.textSecondary || (isDarkMode ? "#6B7280" : "#9CA3AF")}
                />
            ) : (
                <Text style={[styles.fieldValue, { color: theme.text }]}>
                    {value}
                </Text>
            )}
            <View style={[styles.separator, { backgroundColor: theme.border || (isDarkMode ? "#374151" : "#E5E7EB") }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: "600" },
    editText: { fontSize: 16, fontWeight: "500" },
    profileSection: { alignItems: "center", paddingVertical: 24 },
    avatarContainer: { marginBottom: 12 },
    avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
    avatarText: { fontSize: 36, fontWeight: "500", color: "#FFFFFF" },
    name: { fontSize: 20, fontWeight: "600", marginBottom: 4 },
    username: { fontSize: 14 },
    form: { paddingHorizontal: 16 },
    fieldContainer: { marginBottom: 4 },
    fieldLabel: { fontSize: 13, fontWeight: "500", marginBottom: 6 },
    fieldValue: { fontSize: 16, paddingVertical: 8 },
    fieldValueInput: { fontSize: 16, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginTop: 4 },
    separator: { height: 1, marginVertical: 8 },
});