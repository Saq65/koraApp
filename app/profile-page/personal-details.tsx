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
import { getUser, setUser } from "../../src/utils/storage";

export default function PersonalDetailsScreen() {
    const { theme, isDarkMode } = useTheme();

    // Define styles NOW (before any conditional return)
    const styles = getStyles(theme, isDarkMode);

    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);

    const [profile, setProfile] = useState({
        fullName: "",
        username: "",
        email: "",
        phone: "",
        dob: "",
    });

    const loadProfile = async () => {
        const storedUser = await getUser();
        if (storedUser) {
            setProfile({
                fullName: storedUser.name || "",
                username: storedUser.username || "",
                email: storedUser.email || "",
                phone: storedUser.mobile || "",
                dob: storedUser.dob || "",
            });
            setLoading(false);
        }

        try {
            const response = await getProfile();
            const data = response.data;
            const freshProfile = {
                fullName: data.fullName || storedUser?.name || "",
                username: data.username || storedUser?.username || "",
                email: data.email || storedUser?.email || "",
                phone: data.mobile || storedUser?.mobile || "",
                dob: data.dob ? data.dob.split("T")[0] : "",
            };
            setProfile(freshProfile);
            await setUser({
                ...storedUser,
                name: freshProfile.fullName,
                username: freshProfile.username,
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

            const storedUser = await getUser();
            await setUser({
                ...storedUser,
                name: profile.fullName,
                email: profile.email,
                mobile: profile.phone,
                dob: profile.dob,
            });

            setEditing(false);
            Alert.alert("Success", "Profile updated successfully");
        } catch (error) {
            console.log("UPDATE ERROR:", error);
            Alert.alert("Error", "Failed to update profile");
        }
    };

    if (loading) {
        return (
            <View style={[styles.loader, { backgroundColor: theme.background }]}>
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
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerEdit}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="arrow-back" size={22} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Personal Details</Text>
                        </View>
                        <TouchableOpacity onPress={() => editing ? handleUpdate() : setEditing(true)}>
                            <Text style={[styles.editText, { color: theme.primary }]}>
                                {editing ? "Save" : "Edit"}
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
                            {profile.fullName || "John Doe"}
                        </Text>
                        <Text style={[styles.username, { color: theme.subText }]}>
                            @{profile.username || profile.fullName.toLowerCase().replace(/\s/g, '')}
                        </Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.form}>
                        <DetailField
                            label="Full Name"
                            value={profile.fullName}
                            editable={editing}
                            theme={theme}
                            isDarkMode={isDarkMode}
                            onChangeText={(text: string) => setProfile({ ...profile, fullName: text })}
                            styles={styles}
                        />
                        <DetailField
                            label="Username"
                            value={`@${profile.username || profile.fullName.toLowerCase().replace(/\s/g, '')}`}
                            editable={false}
                            theme={theme}
                            isDarkMode={isDarkMode}
                            styles={styles}
                        />
                        <DetailField
                            label="Date of Birth"
                            value={profile.dob}
                            editable={editing}
                            theme={theme}
                            isDarkMode={isDarkMode}
                            onChangeText={(text: string) => setProfile({ ...profile, dob: text })}
                            placeholder="YYYY-MM-DD"
                            styles={styles}
                        />
                        <DetailField
                            label="Mobile Number"
                            value={profile.phone}
                            editable={editing}
                            theme={theme}
                            isDarkMode={isDarkMode}
                            onChangeText={(text: string) => setProfile({ ...profile, phone: text })}
                            keyboardType="phone-pad"
                            styles={styles}
                        />
                        <DetailField
                            label="Email"
                            value={profile.email}
                            editable={editing}
                            theme={theme}
                            isDarkMode={isDarkMode}
                            onChangeText={(text: string) => setProfile({ ...profile, email: text })}
                            keyboardType="email-address"
                            styles={styles}
                        />
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </AppBackground>
        </SafeAreaView>
    );
}

// Detail field component
function DetailField({
    label,
    value,
    editable,
    theme,
    isDarkMode,
    onChangeText,
    keyboardType = "default",
    placeholder = "",
    styles,
}: any) {
    return (
        <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.subText }]}>
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
                            borderColor: theme.border,
                        }
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    placeholder={placeholder}
                    placeholderTextColor={theme.subText}
                />
            ) : (
                <Text style={[styles.fieldValue, { color: theme.text }]}>
                    {value || "Not provided"}
                </Text>
            )}
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
        </View>
    );
}

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
    container: { flex: 1 },
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerEdit:{
flexDirection: "row",
        alignItems: "center",
gap:10
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.card,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: theme.text,
    },
    editText: {
        fontSize: 16,
        fontWeight: "600",
    },
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