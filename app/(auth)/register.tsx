import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from "react-native";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { registerUser } from "../../src/api/auth";
import { router } from "expo-router";

export default function RegisterScreen() {
    const { theme } = useTheme();

    const [form, setForm] = useState({
        username: "",
        password: "",
        mobile: "",
        fullName: "",
        email: "",
        dob: "",
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (key: string, value: string) => {
        setForm({ ...form, [key]: value });
    };

    const handleRegister = async () => {
        try {
            setLoading(true);

            const payload = {
                ...form,
                 role: "customer",
            };

            const res = await registerUser(payload,);

            console.log("REGISTER SUCCESS:", res);

            // 👉 redirect to login
            router.replace("/(auth)/login");


        } catch (error: any) {
            console.log("REGISTER ERROR:", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Logo */}
            <View style={styles.logoContainer}>
                <View
                    style={[
                        styles.logoBox,
                        { backgroundColor: theme.primaryLight || theme.primary },
                    ]}
                >
                    <Text style={styles.logoIcon}>💧</Text>
                </View>

                <Text style={[styles.logoText, { color: theme.primary }]}>
                    KORA Care
                </Text>

                <Text style={[styles.subTitle, { color: theme.subText }]}>
                    Create your account
                </Text>
            </View>

            {/* Input Fields */}
            {renderInput("Username *", "Choose a username", "person-outline", form.username, (v) => handleChange("username", v), theme)}

            {renderInput("Password *", "Min 6 characters", "lock-closed-outline", form.password, (v) => handleChange("password", v), theme, true)}

            {renderInput("Mobile Number *", "+91 or 9XXXXXXXXX", "call-outline", form.mobile, (v) => handleChange("mobile", v), theme)}

            {renderInput("Full Name *", "Your full name", "person-circle-outline", form.fullName, (v) => handleChange("fullName", v), theme)}

            {renderInput("Email (optional)", "your@email.com", "mail-outline", form.email, (v) => handleChange("email", v), theme)}

            {renderInput("Date of Birth (optional)", "YYYY-MM-DD", "calendar-outline", form.dob, (v) => handleChange("dob", v), theme)}

            {/* Button */}
            <TouchableOpacity
                style={styles.buttonWrapper}
                onPress={handleRegister}
                disabled={loading}
            >
                <LinearGradient
                    colors={theme.gradient || [theme.primary, theme.primary]}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>
                        {loading ? "Creating..." : "Create Account"}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
                <View style={[styles.line, { backgroundColor: theme.border }]} />
                <Text style={[styles.orText, { color: theme.subText }]}>
                    or
                </Text>
                <View style={[styles.line, { backgroundColor: theme.border }]} />
            </View>

            {/* Google */}
            <TouchableOpacity
                style={[
                    styles.googleBtn,
                    { backgroundColor: theme.card, borderColor: theme.border },
                ]}
            >
                <Text style={{ fontSize: 18 }}>🌐</Text>
                <Text style={[styles.googleText, { color: theme.text }]}>
                    Sign up with Google
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

/* 🔥 Reusable Input Component */
const renderInput = (
    label: string,
    placeholder: string,
    icon: any,
    value: string,
    onChange: (v: string) => void,
    theme: any,
    secure = false
) => (
    <View style={{ marginBottom: 15 }}>
        <Text style={{ color: theme.text, marginBottom: 5 }}>{label}</Text>

        <View
            style={[
                styles.inputContainer,
                { backgroundColor: theme.inputBg || theme.card },
            ]}
        >
            <Ionicons name={icon} size={18} color={theme.subText} />

            <TextInput
                placeholder={placeholder}
                placeholderTextColor={theme.subText}
                style={[styles.input, { color: theme.text }]}
                value={value}
                onChangeText={onChange}
                secureTextEntry={secure}
            />

            {secure && (
                <Ionicons name="eye-outline" size={18} color={theme.subText} />
            )}
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    logoContainer: {
        alignItems: "center",
        marginBottom: 30,
    },

    logoBox: {
        width: 70,
        height: 70,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },

    logoIcon: {
        fontSize: 30,
        color: "#fff",
    },

    logoText: {
        fontSize: 26,
        fontWeight: "700",
    },

    subTitle: {
        fontSize: 14,
    },

    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        borderRadius: 14,
    },

    input: {
        flex: 1,
        marginLeft: 10,
    },

    buttonWrapper: {
        marginTop: 20,
        borderRadius: 14,
        overflow: "hidden",
    },

    button: {
        padding: 15,
        alignItems: "center",
    },

    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },

    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 25,
    },

    line: {
        flex: 1,
        height: 1,
    },

    orText: {
        marginHorizontal: 10,
        fontSize: 12,
    },

    googleBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
    },

    googleText: {
        marginLeft: 10,
        fontWeight: "500",
    },
});