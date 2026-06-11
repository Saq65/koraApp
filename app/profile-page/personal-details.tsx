import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../src/theme/ThemeProvider";
import {
    getProfile,
    updateProfile,
    requestEmailOtp,
    verifyEmailOtp,
    requestMobileOtp,
    verifyMobileOtp,
} from "../../src/services/customer";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "@/components/AppBackground";
import { getUser, setUser } from "../../src/utils/storage";

export default function PersonalDetailsScreen() {
    const { theme, isDarkMode } = useTheme();
    const styles = getStyles(theme, isDarkMode);

    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [profile, setProfile] = useState({
        fullName: "",
        email: "",
        phone: "",
        dob: "",
    });
    const [originalProfile, setOriginalProfile] = useState(profile);

    // OTP state
    const [otpModalVisible, setOtpModalVisible] = useState(false);
    const [otpField, setOtpField] = useState<"email" | "mobile" | null>(null);
    const [otpValue, setOtpValue] = useState("");
    const [newValue, setNewValue] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState("");

    // Queue for sequential OTP changes
    const [changeQueue, setChangeQueue] = useState<Array<{ type: 'email' | 'mobile'; value: string }>>([]);
    const [processingQueue, setProcessingQueue] = useState(false);

    // OTP Input Component
    const OtpInput = ({ length = 6, onOtpChange, value }: { length?: number; onOtpChange: (otp: string) => void; value: string }) => {
        const [otp, setOtp] = useState(value);
        const inputs = useRef<(TextInput | null)[]>([]);

        const handleChange = (text: string, index: number) => {
            if (text.length > 1) text = text[0];
            const newOtp = otp.split('');
            newOtp[index] = text;
            const newOtpStr = newOtp.join('');
            setOtp(newOtpStr);
            onOtpChange(newOtpStr);
            if (text && index < length - 1) {
                inputs.current[index + 1]?.focus();
            }
        };

        const handleKeyPress = (e: any, index: number) => {
            if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
                inputs.current[index - 1]?.focus();
            }
        };

        useEffect(() => {
            if (otpModalVisible) {
                setOtp('');
                onOtpChange('');
                setTimeout(() => inputs.current[0]?.focus(), 100);
            }
        }, [otpModalVisible]);

        return (
            <View style={styles.otpContainer}>
                {Array(length).fill(0).map((_, i) => (
                    <TextInput
                        key={i}
                        ref={ref => inputs.current[i] = ref}
                        style={styles.otpBox}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={otp[i] || ''}
                        onChangeText={(text) => handleChange(text, i)}
                        onKeyPress={(e) => handleKeyPress(e, i)}
                    />
                ))}
            </View>
        );
    };

    const loadProfile = async () => {
        const storedUser = await getUser();
        if (storedUser) {
            const loaded = {
                fullName: storedUser.name || "",
                email: storedUser.email || "",
                phone: storedUser.mobile || "",
                dob: storedUser.dob || "",
            };
            setProfile(loaded);
            setOriginalProfile(loaded);
        }
        try {
            const response = await getProfile();
            const data = response.data;
            const freshProfile = {
                fullName: data.fullName || storedUser?.name || "",
                email: data.email || storedUser?.email || "",
                phone: data.phone || storedUser?.mobile || "",
                dob: data.dob ? data.dob.split("T")[0] : "",
            };
            setProfile(freshProfile);
            setOriginalProfile(freshProfile);
            await setUser({
                ...storedUser,
                name: freshProfile.fullName,
                email: freshProfile.email,
                mobile: freshProfile.phone,
                dob: freshProfile.dob,
            });
        } catch (error) {
            console.log("Refresh error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleSaveBasic = async () => {
        setError(null);
        try {
            await updateProfile({
                fullName: profile.fullName,
                dob: profile.dob,
            });
            const storedUser = await getUser();
            await setUser({
                ...storedUser,
                name: profile.fullName,
                dob: profile.dob,
            });
            setOriginalProfile(prev => ({ ...prev, fullName: profile.fullName, dob: profile.dob }));
            Alert.alert("Success", "Name and date of birth updated");
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Update failed";
            setError(msg);
            Alert.alert("Error", msg);
        }
    };

    const requestOtp = async (type: "email" | "mobile", value: string) => {
        setOtpLoading(true);
        setOtpError("");
        try {
            if (type === "email") {
                await requestEmailOtp({ newEmail: value });
            } else {
                await requestMobileOtp({ newMobile: value });
            }
            setOtpModalVisible(true);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to send OTP";
            setOtpError(msg);
            Alert.alert("Error", msg);
            setChangeQueue(prev => prev.slice(1));
            setProcessingQueue(false);
            processQueue();
        } finally {
            setOtpLoading(false);
        }
    };

    const processQueue = async () => {
        if (processingQueue) return;
        if (changeQueue.length === 0) {
            setEditing(false);
            return;
        }
        setProcessingQueue(true);
        const next = changeQueue[0];
        setOtpField(next.type);
        setNewValue(next.value);
        setOtpValue("");
        await requestOtp(next.type, next.value);
    };

    const verifyOtpAndUpdate = async () => {
        if (!otpValue || otpValue.length !== 6) {
            Alert.alert("Invalid OTP", "Please enter 6-digit OTP");
            return;
        }
        setOtpLoading(true);
        setOtpError("");
        try {
            if (otpField === "email") {
                await verifyEmailOtp({ newEmail: newValue, otp: otpValue });
                setProfile(prev => ({ ...prev, email: newValue }));
                setOriginalProfile(prev => ({ ...prev, email: newValue }));
                const storedUser = await getUser();
                await setUser({ ...storedUser, email: newValue });
                Alert.alert("Success", "Email updated successfully");
            } else if (otpField === "mobile") {
                await verifyMobileOtp({ newMobile: newValue, otp: otpValue });
                setProfile(prev => ({ ...prev, phone: newValue }));
                setOriginalProfile(prev => ({ ...prev, phone: newValue }));
                const storedUser = await getUser();
                await setUser({ ...storedUser, mobile: newValue });
                Alert.alert("Success", "Mobile number updated successfully");
            }
            setOtpModalVisible(false);
            setOtpValue("");
            setChangeQueue(prev => prev.slice(1));
            setProcessingQueue(false);
            setTimeout(() => processQueue(), 500);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Verification failed";
            setOtpError(msg);
            Alert.alert("Error", msg);
        } finally {
            setOtpLoading(false);
        }
    };

    const onSavePress = async () => {
        const nameChanged = profile.fullName !== originalProfile.fullName;
        const dobChanged = profile.dob !== originalProfile.dob;
        const emailChanged = profile.email !== originalProfile.email;
        const phoneChanged = profile.phone !== originalProfile.phone;

        if (nameChanged || dobChanged) {
            await handleSaveBasic();
        }

        const queue: Array<{ type: 'email' | 'mobile'; value: string }> = [];
        if (emailChanged) queue.push({ type: 'email', value: profile.email });
        if (phoneChanged) queue.push({ type: 'mobile', value: profile.phone });
        if (queue.length === 0) {
            setEditing(false);
            return;
        }
        setChangeQueue(queue);
        processQueue();
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
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                                <Ionicons name="arrow-back" size={22} color={theme.text} />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Personal Details</Text>
                            {!editing && (
                                <TouchableOpacity onPress={() => setEditing(true)}>
                                    <Text style={[styles.editText, { color: theme.primary }]}>Edit</Text>
                                </TouchableOpacity>
                            )}
                            {editing && <View style={{ width: 40 }} />}
                        </View>

                        {/* Avatar & Name */}
                        <View style={styles.avatarSection}>
                            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                                <Text style={styles.avatarText}>
                                    {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "?"}
                                </Text>
                            </View>
                            {editing ? (
                                <TextInput
                                    style={[styles.nameInput, { color: theme.text, borderBottomColor: theme.border }]}
                                    value={profile.fullName}
                                    onChangeText={(text) => setProfile({ ...profile, fullName: text })}
                                    placeholder="Full Name"
                                    placeholderTextColor={theme.subText}
                                />
                            ) : (
                                <Text style={[styles.name, { color: theme.text }]}>{profile.fullName || "User"}</Text>
                            )}
                        </View>

                        {/* Details Fields */}
                        <View style={styles.detailsCard}>
                            <DetailField
                                label="Full Name"
                                value={profile.fullName}
                                editable={editing}
                                onChangeText={(text) => setProfile({ ...profile, fullName: text })}
                                theme={theme}
                                isDarkMode={isDarkMode}
                                styles={styles}
                            />
                            <DetailField
                                label="Date of Birth"
                                value={profile.dob}
                                editable={editing}
                                onChangeText={(text) => setProfile({ ...profile, dob: text })}
                                placeholder="YYYY-MM-DD"
                                theme={theme}
                                isDarkMode={isDarkMode}
                                styles={styles}
                            />
                            <DetailField
                                label="Mobile Number"
                                value={profile.phone}
                                editable={editing}
                                onChangeText={(text) => setProfile({ ...profile, phone: text })}
                                keyboardType="phone-pad"
                                theme={theme}
                                isDarkMode={isDarkMode}
                                styles={styles}
                            />
                            <DetailField
                                label="Email"
                                value={profile.email}
                                editable={editing}
                                onChangeText={(text) => setProfile({ ...profile, email: text })}
                                keyboardType="email-address"
                                theme={theme}
                                isDarkMode={isDarkMode}
                                styles={styles}
                            />
                            {error && <Text style={styles.errorText}>{error}</Text>}
                        </View>

                        {editing && (
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={onSavePress}>
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </AppBackground>

            {/* OTP Modal */}
            <Modal visible={otpModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            Verify {otpField === "email" ? "Email" : "Mobile"}
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: theme.subText }]}>
                            Enter the 6-digit OTP sent to {newValue}
                        </Text>
                        <OtpInput length={6} onOtpChange={setOtpValue} value={otpValue} />
                        {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
                        <TouchableOpacity style={[styles.verifyButton, { backgroundColor: theme.primary }]} onPress={verifyOtpAndUpdate} disabled={otpLoading}>
                            {otpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyButtonText}>Verify & Update</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setOtpModalVisible(false)}>
                            <Text style={[styles.cancelText, { color: theme.primary }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// DetailField component (reusable)
function DetailField({ label, value, editable, theme, isDarkMode, onChangeText, keyboardType = "default", placeholder = "", styles }: any) {
    return (
        <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.subText }]}>{label}</Text>
            {editable ? (
                <TextInput
                    style={[styles.fieldValueInput, { color: theme.text, backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB", borderWidth: 1, borderColor: theme.border }]}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    placeholder={placeholder}
                    placeholderTextColor={theme.subText}
                />
            ) : (
                <Text style={[styles.fieldValue, { color: theme.text }]}>{value || "Not provided"}</Text>
            )}
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
        </View>
    );
}

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
    container: { flex: 1 },
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: theme.text },
    editText: { fontSize: 16, fontWeight: "600" },
    avatarSection: { alignItems: "center", marginVertical: 20 },
    avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
    avatarText: { fontSize: 36, fontWeight: "500", color: "#FFFFFF" },
    name: { fontSize: 22, fontWeight: "600", marginTop: 12, color: theme.text },
    nameInput: { fontSize: 22, fontWeight: "600", marginTop: 12, textAlign: "center", borderBottomWidth: 1, paddingVertical: 4, minWidth: 150 },
    detailsCard: { backgroundColor: theme.card, borderRadius: 16, marginHorizontal: 16, paddingHorizontal: 16, paddingVertical: 8, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    fieldContainer: { marginBottom: 8 },
    fieldLabel: { fontSize: 13, fontWeight: "500", marginBottom: 4 },
    fieldValue: { fontSize: 16, paddingVertical: 8 },
    fieldValueInput: { fontSize: 16, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginTop: 4 },
    separator: { height: 1, marginVertical: 8 },
    errorText: { color: "red", fontSize: 14, marginTop: 8, textAlign: "center" },
    saveButton: { marginHorizontal: 16, marginTop: 24, paddingVertical: 14, borderRadius: 30, alignItems: "center" },
    saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    modalContent: { width: "80%", borderRadius: 20, padding: 20, alignItems: "center" },
    modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
    modalSubtitle: { fontSize: 14, marginBottom: 20, textAlign: "center" },
    otpContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 20, gap: 10 },
    otpBox: { width: 50, height: 50, borderRadius: 12, borderWidth: 1, borderColor: theme.border, textAlign: "center", fontSize: 20, fontWeight: "600", backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB", color: theme.text },
    verifyButton: { width: "100%", paddingVertical: 12, borderRadius: 30, alignItems: "center", marginBottom: 12 },
    verifyButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
    cancelText: { fontSize: 14, fontWeight: "500" },
});