import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "@/components/AppBackground";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { submitComplaint } from "../../src/api/support"; // we'll create this API function

export default function RaiseComplaintScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Form state
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Categories (main)
  const mainCategories = [
    "Order Issue",
    "Delivery Delay",
    "Payment Problem",
    "Staff Behaviour",
    "App / Technical",
    "Other",
  ];

  // Sub‑categories for "Order Issue"
  const orderIssueSubs = ["Damaged Item", "Missing Item"];

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("common.permission_needed"), t("common.photo_permission_message"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const validateForm = () => {
    if (!selectedMainCategory) {
      setError(t("complaint.select_category"));
      return false;
    }
    if (selectedMainCategory === "Order Issue" && !selectedSubCategory) {
      setError(t("complaint.select_order_issue_sub"));
      return false;
    }
    if (!subject.trim()) {
      setError(t("complaint.subject_required"));
      return false;
    }
    if (!description.trim()) {
      setError(t("complaint.description_required"));
      return false;
    }
    if (description.length > 1000) {
      setError(t("complaint.description_too_long"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError("");

    const complaintData = {
      category: selectedMainCategory === "Order Issue" ? `${selectedMainCategory} - ${selectedSubCategory}` : selectedMainCategory,
      orderId: orderId.trim() || undefined,
      subject: subject.trim(),
      description: description.trim(),
      photo: imageUri, // we'll need to upload the image separately, but for now send URI or base64
    };

    try {
      // Replace with your actual API call
      await submitComplaint(complaintData);
      Alert.alert(t("complaint.success_title"), t("complaint.success_message"));
      router.back();
    } catch (err: any) {
      setError(err.message || t("complaint.submit_failed"));
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryChip = (category: string, isSub = false) => {
    const isSelected = isSub
      ? selectedSubCategory === category
      : selectedMainCategory === category;
    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryChip,
          {
            backgroundColor: isSelected ? theme.primary : theme.card,
            borderColor: theme.border || "#ddd",
          },
        ]}
        onPress={() => {
          if (isSub) {
            setSelectedSubCategory(category);
          } else {
            setSelectedMainCategory(category);
            setSelectedSubCategory(null); // reset sub when main changes
          }
        }}
      >
        <Text
          style={[
            styles.categoryChipText,
            { color: isSelected ? "#fff" : theme.text },
          ]}
        >
          {t(`complaint.${category.toLowerCase().replace(/[ /]+/g, "_")}`) || category}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <AppBackground>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with back button */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {t("complaint.title")}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Support contact row (Call, Email, WhatsApp) */}
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactIcon}>
              <Ionicons name="call-outline" size={24} color={theme.primary} />
              <Text style={[styles.contactText, { color: theme.text }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={24} color={theme.primary} />
              <Text style={[styles.contactText, { color: theme.text }]}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactIcon}>
              <Ionicons name="logo-whatsapp" size={24} color={theme.primary} />
              <Text style={[styles.contactText, { color: theme.text }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.infoText, { color: theme.subText }]}>
            {t("complaint.info_text")}
          </Text>

          {/* Category section */}
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            {t("complaint.category")}
          </Text>
          <View style={styles.categoriesContainer}>
            {mainCategories.map((cat) => renderCategoryChip(cat))}
          </View>

          {/* Sub‑categories for Order Issue */}
          {selectedMainCategory === "Order Issue" && (
            <View style={styles.subCategoriesContainer}>
              {orderIssueSubs.map((sub) => renderCategoryChip(sub, true))}
            </View>
          )}

          {/* Order ID (optional) */}
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            {t("complaint.order_id")} <Text style={styles.optionalLabel}>({t("common.optional")})</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg || theme.card,
                color: theme.text,
                borderColor: theme.border || "#ddd",
              },
            ]}
            placeholder={t("complaint.order_id_placeholder")}
            placeholderTextColor={theme.subText}
            value={orderId}
            onChangeText={setOrderId}
          />

          {/* Subject (required) */}
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            {t("complaint.subject")} *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg || theme.card,
                color: theme.text,
                borderColor: theme.border || "#ddd",
              },
            ]}
            placeholder={t("complaint.subject_placeholder")}
            placeholderTextColor={theme.subText}
            value={subject}
            onChangeText={setSubject}
          />

          {/* Description (required) with counter */}
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            {t("complaint.description")} *
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.inputBg || theme.card,
                color: theme.text,
                borderColor: theme.border || "#ddd",
              },
            ]}
            placeholder={t("complaint.description_placeholder")}
            placeholderTextColor={theme.subText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={description}
            onChangeText={(text) => {
              if (text.length <= 1000) setDescription(text);
            }}
          />
          <Text style={[styles.charCounter, { color: theme.subText }]}>
            {description.length}/1000
          </Text>

          {/* Photo attachment */}
          <TouchableOpacity style={styles.attachButton} onPress={handlePickImage}>
            <Ionicons name="camera-outline" size={20} color={theme.primary} />
            <Text style={[styles.attachButtonText, { color: theme.primary }]}>
              {t("complaint.attach_photo")}
            </Text>
          </TouchableOpacity>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Submit button */}
          <TouchableOpacity onPress={handleSubmit} disabled={loading}>
            <LinearGradient
              colors={theme.gradient || [theme.primary, theme.primary]}
              style={styles.submitButton}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {t("complaint.submit")}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  contactIcon: {
    alignItems: "center",
  },
  contactText: {
    fontSize: 12,
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 16,
  },
  optionalLabel: {
    fontSize: 12,
    fontWeight: "normal",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  subCategoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
    marginLeft: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
  },
  charCounter: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  attachButtonText: {
    fontSize: 14,
    marginLeft: 8,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 12,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});