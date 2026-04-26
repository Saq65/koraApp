import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { registerUser } from "../../src/api/auth";
import { router } from "expo-router";

const logoImage = require("../../assets/images/kora-logo.png");

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
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError(""); // clear error on change
  };

  const handleMobileChange = (value: string) => {
    const onlyNumbers = value.replace(/[^0-9]/g, "");
    handleChange("mobile", onlyNumbers.slice(0, 10));
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      setFocusedInput(null);
    }

    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      handleChange("dob", formattedDate);
    }
  };

  const handleRegister = async () => {
    try {
      setError("");
      
      // Validation
      if (!form.username.trim()) {
        setError("Username is required");
        return;
      }
      if (!form.password || form.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      if (!form.mobile || form.mobile.length !== 10) {
        setError("Please enter a valid 10-digit mobile number");
        return;
      }
      if (!form.fullName.trim()) {
        setError("Full name is required");
        return;
      }

      setLoading(true);

      // Normalize mobile number: add +91 prefix
      const normalizedMobile = `+91${form.mobile}`;
      
      const payload = {
        username: form.username,
        password: form.password,
        mobile: normalizedMobile,
        fullName: form.fullName,
        email: form.email || undefined,
        dob: form.dob || undefined,
        role: "customer",
      };

      const res = await registerUser(payload);
      console.log("REGISTER SUCCESS:", res);

      // Navigate to login screen
      router.replace("/(auth)/login");
    } catch (error: any) {
      console.log("REGISTER ERROR:", error.message);
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputBoxStyle = (name: string) => [
    styles.inputContainer,
    {
      backgroundColor: theme.inputBg || theme.card,
      borderColor:
        focusedInput === name ? theme.primary : theme.border || "#ddd",
      borderWidth: focusedInput === name ? 2 : 1,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.logoContainer}>
        <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
        <Text style={[styles.logoText, { color: theme.primary }]}>KORA</Text>
        <Text style={[styles.subTitle, { color: theme.subText }]}>
          Create your account
        </Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <InputField
        label="Username *"
        placeholder="Choose a username"
        icon="person-outline"
        value={form.username}
        onChangeText={(v: string) => handleChange("username", v)}
        theme={theme}
        containerStyle={inputBoxStyle("username")}
        onFocus={() => setFocusedInput("username")}
        onBlur={() => setFocusedInput(null)}
      />

      <View style={styles.fieldWrapper}>
        <Text style={[styles.label, { color: theme.text }]}>Password *</Text>
        <View style={inputBoxStyle("password")}>
          <Ionicons name="lock-closed-outline" size={18} color={theme.subText} />
          <TextInput
            placeholder="Min 6 characters"
            placeholderTextColor={theme.subText}
            style={[styles.input, { color: theme.text }]}
            value={form.password}
            onChangeText={(v) => handleChange("password", v)}
            secureTextEntry={secureTextEntry}
            onFocus={() => setFocusedInput("password")}
            onBlur={() => setFocusedInput(null)}
          />
          <TouchableOpacity onPress={() => setSecureTextEntry(prev => !prev)}>
            <Ionicons
              name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
              size={18}
              color={theme.subText}
            />
          </TouchableOpacity>
        </View>
      </View>

      <InputField
        label="Mobile Number *"
        placeholder="Enter 10 digit mobile number"
        icon="call-outline"
        value={form.mobile}
        onChangeText={handleMobileChange}
        theme={theme}
        keyboardType="number-pad"
        maxLength={10}
        containerStyle={inputBoxStyle("mobile")}
        onFocus={() => setFocusedInput("mobile")}
        onBlur={() => setFocusedInput(null)}
      />

      <InputField
        label="Full Name *"
        placeholder="Your full name"
        icon="person-circle-outline"
        value={form.fullName}
        onChangeText={(v: string) => handleChange("fullName", v)}
        theme={theme}
        containerStyle={inputBoxStyle("fullName")}
        onFocus={() => setFocusedInput("fullName")}
        onBlur={() => setFocusedInput(null)}
      />

      <InputField
        label="Email (optional)"
        placeholder="your@email.com"
        icon="mail-outline"
        value={form.email}
        onChangeText={(v: string) => handleChange("email", v)}
        theme={theme}
        keyboardType="email-address"
        autoCapitalize="none"
        containerStyle={inputBoxStyle("email")}
        onFocus={() => setFocusedInput("email")}
        onBlur={() => setFocusedInput(null)}
      />

      <View style={styles.fieldWrapper}>
        <Text style={[styles.label, { color: theme.text }]}>
          Date of Birth (optional)
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setFocusedInput("dob");
            setShowDatePicker(true);
          }}
          style={inputBoxStyle("dob")}
        >
          <Ionicons name="calendar-outline" size={18} color={theme.subText} />
          <Text
            style={[
              styles.input,
              { color: form.dob ? theme.text : theme.subText },
            ]}
          >
            {form.dob || "Select date of birth"}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={form.dob ? new Date(form.dob) : new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )}
      </View>

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

      <View style={styles.dividerContainer}>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
        <Text style={[styles.orText, { color: theme.subText }]}>or</Text>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
      </View>

      <TouchableOpacity
        style={[
          styles.googleBtn,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={styles.googleIcon}>🌐</Text>
        <Text style={[styles.googleText, { color: theme.text }]}>
          Sign up with Google
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InputField({
  label,
  placeholder,
  icon,
  value,
  onChangeText,
  theme,
  containerStyle,
  onFocus,
  onBlur,
  keyboardType = "default",
  maxLength,
  autoCapitalize = "sentences",
}: any) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={containerStyle}>
        <Ionicons name={icon} size={18} color={theme.subText} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={theme.subText}
          style={[styles.input, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  logoContainer: { alignItems: "center", marginBottom: 30 },
  logoImage: { width: 80, height: 80, marginBottom: 10 },
  logoText: { fontSize: 26, fontWeight: "700" },
  subTitle: { fontSize: 14 },
  fieldWrapper: { marginBottom: 15 },
  label: { marginBottom: 6, fontSize: 14, fontWeight: "500" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 14,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 15 },
  buttonWrapper: { marginTop: 20, borderRadius: 14, overflow: "hidden" },
  button: { padding: 15, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: 25 },
  line: { flex: 1, height: 1 },
  orText: { marginHorizontal: 10, fontSize: 12 },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, borderWidth: 1 },
  googleIcon: { fontSize: 18 },
  googleText: { marginLeft: 10, fontWeight: "500" },
  errorText: { color: "red", textAlign: "center", marginBottom: 10, fontSize: 14 },
});