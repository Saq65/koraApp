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

export default function PersonalDetailsScreen() {
    const { theme } = useTheme();

    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);

    const [profile, setProfile] = useState({
        fullName: "",
        email: "",
        phone: "",
        dob: "",
    });

    // ─────────────────────────────────────────────
    // FETCH PROFILE
    // ─────────────────────────────────────────────
    const fetchProfile = async () => {
        try {
            setLoading(true);

            const response = await getProfile();

            // depending on your apiClient response structure
            const data = response.data;

            setProfile({
                fullName: data.fullName || "",
                email: data.email || "",
                phone: data.mobile || "",
                dob: data.dob
                    ? data.dob.split("T")[0]
                    : "",
            });
        } catch (error) {
            console.log("PROFILE ERROR:", error);

            Alert.alert(
                "Error",
                "Failed to load profile"
            );
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────
    // UPDATE PROFILE
    // ─────────────────────────────────────────────
    const handleUpdate = async () => {
        try {
            const formattedProfile = {
                ...profile,
                dob: profile.dob
                    ? new Date(profile.dob).toISOString()
                    : "",
            };

            await updateProfile(formattedProfile);

            setEditing(false);

            Alert.alert(
                "Success",
                "Profile updated successfully"
            );
        } catch (error) {
            console.log("UPDATE ERROR:", error);

            Alert.alert(
                "Error",
                "Failed to update profile"
            );
        }
    };

    // ─────────────────────────────────────────────
    // INITIAL FETCH
    // ─────────────────────────────────────────────
    useEffect(() => {
        fetchProfile();
    }, []);

    // ─────────────────────────────────────────────
    // LOADING
    // ─────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator
                    size="large"
                    color={theme.primary}
                />
            </View>
        );
    }

    return (
        <ScrollView
            style={[
                styles.container,
                { backgroundColor: theme.background },
            ]}
            showsVerticalScrollIndicator={false}
        >
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={theme.text}
                    />
                </TouchableOpacity>

                <Text
                    style={[
                        styles.headerTitle,
                        { color: theme.text },
                    ]}
                >
                    Personal Details
                </Text>

                <TouchableOpacity
                    onPress={() => {
                        if (editing) {
                            handleUpdate();
                        } else {
                            setEditing(true);
                        }
                    }}
                >
                    <View
                        style={[
                            styles.editBtn,
                            {
                                backgroundColor:
                                    theme.primaryLight || "#E6F4F1",
                            },
                        ]}
                    >
                        <Ionicons
                            name={
                                editing
                                    ? "checkmark"
                                    : "create-outline"
                            }
                            size={18}
                            color={theme.primary}
                        />

                        <Text
                            style={{
                                color: theme.primary,
                                fontWeight: "600",
                                marginLeft: 5,
                            }}
                        >
                            {editing ? "Save" : "Edit"}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* PROFILE CARD */}
            <View
                style={[
                    styles.card,
                    { backgroundColor: theme.primary },
                ]}
            >
                <View style={styles.avatar}>
                    <Ionicons
                        name="person-outline"
                        size={40}
                        color="#fff"
                    />
                </View>

                <Text style={styles.name}>
                    {profile.fullName || "User"}
                </Text>

                <Text style={styles.username}>
                    {profile.email || profile.phone}
                </Text>
            </View>

            {/* FORM */}
            <View style={styles.form}>
                <InputField
                    icon="person-outline"
                    label="Full Name"
                    value={profile.fullName}
                    editable={editing}
                    onChangeText={(text: string) =>
                        setProfile({
                            ...profile,
                            fullName: text,
                        })
                    }
                />

                <InputField
                    icon="mail-outline"
                    label="Email"
                    value={profile.email}
                    editable={editing}
                    keyboardType="email-address"
                    onChangeText={(text: string) =>
                        setProfile({
                            ...profile,
                            email: text,
                        })
                    }
                />

                <InputField
                    icon="call-outline"
                    label="Mobile Number"
                    value={profile.phone}
                    editable={editing}
                    keyboardType="phone-pad"
                    onChangeText={(text: string) =>
                        setProfile({
                            ...profile,
                            phone: text,
                        })
                    }
                />

                <InputField
                    icon="calendar-outline"
                    label="Date of Birth"
                    value={profile.dob}
                    editable={editing}
                    placeholder="DD/MM/YYYY"
                    onChangeText={(text: string) =>
                        setProfile({
                            ...profile,
                            dob: text,
                        })
                    }
                />
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

// ─────────────────────────────────────────────
// INPUT FIELD COMPONENT
// ─────────────────────────────────────────────
function InputField({
    icon,
    label,
    value,
    editable,
    onChangeText,
    keyboardType = "default",
    placeholder = "",
}: any) {
    return (
        <View style={{ marginBottom: 20 }}>
            <Text style={styles.label}>
                {label}
            </Text>

            <View style={styles.inputContainer}>
                <Ionicons
                    name={icon}
                    size={20}
                    color="#7a7a7a"
                    style={{ marginRight: 10 }}
                />

                <TextInput
                    value={value}
                    editable={editable}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    placeholder={placeholder}
                    style={[
                        styles.input,
                        {
                            backgroundColor: editable
                                ? "#fff"
                                : "#f1f1f1",
                        },
                    ]}
                />
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },

    headerTitle: {
        fontSize: 28,
        fontWeight: "700",
    },

    editBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },

    card: {
        marginHorizontal: 20,
        borderRadius: 28,
        padding: 25,
        alignItems: "center",
        marginTop: 10,
    },

    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#ffffff33",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },

    name: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "700",
    },

    username: {
        color: "#fff",
        marginTop: 6,
        fontSize: 14,
    },

    form: {
        padding: 20,
    },

    label: {
        marginBottom: 10,
        fontWeight: "600",
        fontSize: 15,
    },

    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 18,
        backgroundColor: "#f1f1f1",
        paddingHorizontal: 14,
    },

    input: {
        flex: 1,
        borderRadius: 18,
        paddingVertical: 15,
        fontSize: 16,
    },
});