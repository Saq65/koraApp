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
import DateTimePicker from "@react-native-community/datetimepicker";

export default function PersonalDetailsScreen() {
    const { theme, isDarkMode } = useTheme();
    const styles = getStyles(theme, isDarkMode);

    const [loading, setLoading] = useState(true);

    // Profile data
    const [profile, setProfile] = useState({
        fullName: "",
        email: "",
        phone: "",
        dob: "",
    });
    const [originalProfile, setOriginalProfile] = useState(profile);

    // Edit states for each field
    const [editName, setEditName] = useState(false);
    const [tempName, setTempName] = useState("");
    const [editDob, setEditDob] = useState(false);
    const [tempDob, setTempDob] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [editEmail, setEditEmail] = useState(false);
    const [tempEmail, setTempEmail] = useState("");
    const [editMobile, setEditMobile] = useState(false);
    const [tempMobile, setTempMobile] = useState("");

    // OTP state (shared for email & mobile)
    const [otpModalVisible, setOtpModalVisible] = useState(false);
    const [otpField, setOtpField] = useState<"email" | "mobile" | null>(null);
    const [otpValue, setOtpValue] = useState("");
    const [newValue, setNewValue] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState("");

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

    // ----- Name update -----
    const handleUpdateName = async () => {
        if (!tempName.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }
        try {
            await updateProfile({ fullName: tempName, dob: profile.dob });
            const storedUser = await getUser();
            await setUser({ ...storedUser, name: tempName });
            setProfile(prev => ({ ...prev, fullName: tempName }));
            setOriginalProfile(prev => ({ ...prev, fullName: tempName }));
            setEditName(false);
            Alert.alert("Success", "Name updated");
        } catch (err: any) {
            Alert.alert("Error", err?.response?.data?.message || "Update failed");
        }
    };

    // ----- DOB update with date picker -----
    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const formatted = selectedDate.toISOString().split("T")[0];
            setTempDob(formatted);
        }
    };

    const handleUpdateDob = async () => {
        if (!tempDob) return;
        try {
            await updateProfile({ fullName: profile.fullName, dob: tempDob });
            const storedUser = await getUser();
            await setUser({ ...storedUser, dob: tempDob });
            setProfile(prev => ({ ...prev, dob: tempDob }));
            setOriginalProfile(prev => ({ ...prev, dob: tempDob }));
            setEditDob(false);
            Alert.alert("Success", "Date of birth updated");
        } catch (err: any) {
            Alert.alert("Error", err?.response?.data?.message || "Update failed");
        }
    };

    // ----- OTP flows (email & mobile) -----
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
        } finally {
            setOtpLoading(false);
        }
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
                setEditEmail(false);
            } else if (otpField === "mobile") {
                await verifyMobileOtp({ newMobile: newValue, otp: otpValue });
                setProfile(prev => ({ ...prev, phone: newValue }));
                setOriginalProfile(prev => ({ ...prev, phone: newValue }));
                const storedUser = await getUser();
                await setUser({ ...storedUser, mobile: newValue });
                Alert.alert("Success", "Mobile number updated successfully");
                setEditMobile(false);
            }
            setOtpModalVisible(false);
            setOtpValue("");
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Verification failed";
            setOtpError(msg);
            Alert.alert("Error", msg);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleEditEmail = () => {
        setTempEmail(profile.email);
        setEditEmail(true);
    };

    const handleSaveEmail = async () => {
        if (!tempEmail || tempEmail === profile.email) {
            setEditEmail(false);
            return;
        }
        setOtpField("email");
        setNewValue(tempEmail);
        await requestOtp("email", tempEmail);
    };

    const handleEditMobile = () => {
        setTempMobile(profile.phone);
        setEditMobile(true);
    };

    const handleSaveMobile = async () => {
        if (!tempMobile || tempMobile === profile.phone) {
            setEditMobile(false);
            return;
        }
        setOtpField("mobile");
        setNewValue(tempMobile);
        await requestOtp("mobile", tempMobile);
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
                            <View style={{ width: 40 }} />
                        </View>

                        {/* Avatar & Name */}
                        <View style={styles.avatarSection}>
                            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                                <Text style={styles.avatarText}>
                                    {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "?"}
                                </Text>
                            </View>
                            <View style={styles.nameRow}>
                                {editName ? (
                                    <>
                                        <TextInput
                                            style={[styles.nameInput, { color: theme.text, borderBottomColor: theme.border }]}
                                            value={tempName}
                                            onChangeText={setTempName}
                                            autoFocus
                                        />
                                        <TouchableOpacity onPress={handleUpdateName} style={styles.actionIcon}>
                                            <Ionicons name="checkmark-circle" size={28} color={theme.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setEditName(false)} style={styles.actionIcon}>
                                            <Ionicons name="close-circle" size={28} color={theme.subText} />
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <Text style={[styles.name, { color: theme.text }]}>{profile.fullName || "User"}</Text>
                                        <TouchableOpacity onPress={() => { setTempName(profile.fullName); setEditName(true); }} style={styles.editIcon}>
                                            <Ionicons name="pencil" size={20} color={theme.primary} />
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Details Card */}
                        <View style={styles.detailsCard}>
                            {/* Full Name field (redundant but per design) */}
                            <DetailFieldWithEdit
                                label="Full Name"
                                value={profile.fullName}
                                isEditing={editName}
                                onEdit={() => { setTempName(profile.fullName); setEditName(true); }}
                                onSave={handleUpdateName}
                                onChangeText={setTempName}
                                tempValue={tempName}
                                theme={theme}
                                isDarkMode={isDarkMode}
                                styles={styles}
                            />

                            {/* Date of Birth with inline edit + date picker */}
                            <View style={styles.fieldContainer}>
                                <Text style={[styles.fieldLabel, { color: theme.subText }]}>Date of Birth</Text>
                                <View style={styles.fieldRow}>
                                    {editDob ? (
                                        <>
                                            <TouchableOpacity
                                                style={[styles.fieldValueInput, { flex: 1, backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB", borderWidth: 1, borderColor: theme.border }]}
                                                onPress={() => setShowDatePicker(true)}
                                            >
                                                <Text style={{ color: theme.text, paddingVertical: 12 }}>{tempDob || "Select date"}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={handleUpdateDob} style={styles.actionIcon}>
                                                <Ionicons name="checkmark-circle" size={28} color={theme.primary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setEditDob(false)} style={styles.actionIcon}>
                                                <Ionicons name="close-circle" size={28} color={theme.subText} />
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={[styles.fieldValue, { flex: 1, color: theme.text }]}>{profile.dob || "Not provided"}</Text>
                                            <TouchableOpacity onPress={() => { setTempDob(profile.dob); setEditDob(true); }} style={styles.editIcon}>
                                                <Ionicons name="pencil" size={20} color={theme.primary} />
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                                <View style={[styles.separator, { backgroundColor: theme.border }]} />
                            </View>

                            {/* Mobile Number with OTP flow */}
                            <View style={styles.fieldContainer}>
                                <Text style={[styles.fieldLabel, { color: theme.subText }]}>Mobile Number</Text>
                                <View style={styles.fieldRow}>
                                    {editMobile ? (
                                        <>
                                            <TextInput
                                                style={[styles.fieldValueInput, { flex: 1, color: theme.text, backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB", borderWidth: 1, borderColor: theme.border }]}
                                                value={tempMobile}
                                                onChangeText={setTempMobile}
                                                keyboardType="phone-pad"
                                                autoFocus
                                            />
                                            <TouchableOpacity onPress={handleSaveMobile} style={styles.actionIcon}>
                                                <Ionicons name="checkmark-circle" size={28} color={theme.primary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setEditMobile(false)} style={styles.actionIcon}>
                                                <Ionicons name="close-circle" size={28} color={theme.subText} />
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={[styles.fieldValue, { flex: 1, color: theme.text }]}>{profile.phone || "Not provided"}</Text>
                                            <TouchableOpacity onPress={handleEditMobile} style={styles.editIcon}>
                                                <Ionicons name="pencil" size={20} color={theme.primary} />
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                                <View style={[styles.separator, { backgroundColor: theme.border }]} />
                            </View>

                            {/* Email with OTP flow */}
                            <View style={styles.fieldContainer}>
                                <Text style={[styles.fieldLabel, { color: theme.subText }]}>Email</Text>
                                <View style={styles.fieldRow}>
                                    {editEmail ? (
                                        <>
                                            <TextInput
                                                style={[styles.fieldValueInput, { flex: 1, color: theme.text, backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB", borderWidth: 1, borderColor: theme.border }]}
                                                value={tempEmail}
                                                onChangeText={setTempEmail}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoFocus
                                            />
                                            <TouchableOpacity onPress={handleSaveEmail} style={styles.actionIcon}>
                                                <Ionicons name="checkmark-circle" size={28} color={theme.primary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setEditEmail(false)} style={styles.actionIcon}>
                                                <Ionicons name="close-circle" size={28} color={theme.subText} />
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={[styles.fieldValue, { flex: 1, color: theme.text }]}>{profile.email || "Not provided"}</Text>
                                            <TouchableOpacity onPress={handleEditEmail} style={styles.editIcon}>
                                                <Ionicons name="pencil" size={20} color={theme.primary} />
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                                <View style={[styles.separator, { backgroundColor: theme.border }]} />
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </AppBackground>

            {/* Date Picker Modal */}
            {showDatePicker && (
                <DateTimePicker
                    value={tempDob ? new Date(tempDob) : new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onDateChange}
                />
            )}

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

// Helper component for fields with pencil icon (Full Name as example)
function DetailFieldWithEdit({ label, value, isEditing, onEdit, onSave, onChangeText, tempValue, theme, isDarkMode, styles }: any) {
    return (
        <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.subText }]}>{label}</Text>
            <View style={styles.fieldRow}>
                {isEditing ? (
                    <>
                        <TextInput
                            style={[styles.fieldValueInput, { flex: 1, color: theme.text, backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB", borderWidth: 1, borderColor: theme.border }]}
                            value={tempValue}
                            onChangeText={onChangeText}
                            autoFocus
                        />
                        <TouchableOpacity onPress={onSave} style={styles.actionIcon}>
                            <Ionicons name="checkmark-circle" size={28} color={theme.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onEdit(false)} style={styles.actionIcon}>
                            <Ionicons name="close-circle" size={28} color={theme.subText} />
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={[styles.fieldValue, { flex: 1, color: theme.text }]}>{value || "Not provided"}</Text>
                        <TouchableOpacity onPress={onEdit} style={styles.editIcon}>
                            <Ionicons name="pencil" size={20} color={theme.primary} />
                        </TouchableOpacity>
                    </>
                )}
            </View>
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
    avatarSection: { alignItems: "center", marginVertical: 20 },
    avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
    avatarText: { fontSize: 36, fontWeight: "500", color: "#FFFFFF" },
    nameRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
    name: { fontSize: 22, fontWeight: "600", color: theme.text },
    nameInput: { fontSize: 22, fontWeight: "600", textAlign: "center", borderBottomWidth: 1, paddingVertical: 4, minWidth: 150 },
    editIcon: { marginLeft: 8, padding: 4 },
    actionIcon: { marginLeft: 8, padding: 4 },
    detailsCard: { backgroundColor: theme.card, borderRadius: 16, marginHorizontal: 16, paddingHorizontal: 16, paddingVertical: 8, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    fieldContainer: { marginBottom: 8 },
    fieldLabel: { fontSize: 13, fontWeight: "500", marginBottom: 4 },
    fieldValue: { fontSize: 16, paddingVertical: 8 },
    fieldValueInput: { fontSize: 16, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginTop: 4 },
    fieldRow: { flexDirection: "row", alignItems: "center" },
    separator: { height: 1, marginVertical: 8 },
    errorText: { color: "red", fontSize: 14, marginTop: 8, textAlign: "center" },
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