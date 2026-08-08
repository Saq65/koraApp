import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from "react-native";

import { useTheme } from "../../src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "@/components/AppBackground";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { getComplaintCategories, submitComplaint } from "../../src/api/support";

interface Category {
  _id: string;
  name: string;
  subCategories: string[];
  isActive: boolean;
  displayOrder: number;
}

// Static fallback data matching the design
const DEFAULT_CATEGORIES: Category[] = [
  {
    _id: "1",
    name: "Order Issue",
    subCategories: ["Damaged Item", "Missing Item", "Wrong Item Received", "Incomplete Order", "Expired Product", "Poor Packaging"],
    isActive: true,
    displayOrder: 1,
  },
  {
    _id: "2",
    name: "Delivery Delay",
    subCategories: [],
    isActive: true,
    displayOrder: 2,
  },
  {
    _id: "3",
    name: "Payment Problem",
    subCategories: [],
    isActive: true,
    displayOrder: 3,
  },
  {
    _id: "4",
    name: "Staff Behaviour",
    subCategories: [],
    isActive: true,
    displayOrder: 4,
  },
  {
    _id: "5",
    name: "App / Technical",
    subCategories: [],
    isActive: true,
    displayOrder: 5,
  },
  {
    _id: "6",
    name: "Other",
    subCategories: [],
    isActive: true,
    displayOrder: 6,
  },
];

const { width: W, height: H } = Dimensions.get("window");
  
const r = (n: number) => Math.round((W / 375) * n);
const rv = (n: number) => Math.round((H / 812) * n);
const rm = (n: number, f = 0.45) => n + (r(n) - n) * f;


export default function RaiseComplaintScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Dynamic state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getComplaintCategories();
        if (response.success && response.categories && response.categories.length > 0) {
          // Filter only active categories
          const active = response.categories.filter((c: Category) => c.isActive);
          if (active.length > 0) {
            setCategories(active);
          } else {
            // Fallback to static data if API returns empty active list
            setCategories(DEFAULT_CATEGORIES);
          }
        } else {
          // Fallback to static data on API failure or empty response
          setCategories(DEFAULT_CATEGORIES);
        }
      } catch (err) {
        console.error(err);
        setCategories(DEFAULT_CATEGORIES);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handlePickFromGallery = async () => {
  const { status } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== "granted") {
    Alert.alert(
      t("common.permission_needed", "Permission needed"),
      t(
        "common.photo_permission_message",
        "Please grant permission to access photos"
      )
    );
    return;
  }

  if (imageUris.length >= 3) {
    Alert.alert(
      "Maximum images",
      "You can attach maximum 3 images."
    );
    return;
  }

  const remainingSlots = 3 - imageUris.length;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: remainingSlots,
    quality: 0.7,
  });

  if (!result.canceled) {
    const newUris = result.assets.map((asset) => asset.uri);

    setImageUris((previous) => [
      ...previous,
      ...newUris,
    ].slice(0, 3));
  }
};

  const handleTakePhoto = async () => {
  if (imageUris.length >= 3) {
    Alert.alert(
      "Maximum images",
      "You can attach maximum 3 images."
    );
    return;
  }

  const { status } =
    await ImagePicker.requestCameraPermissionsAsync();

  if (status !== "granted") {
    Alert.alert(
      t("common.permission_needed", "Permission needed"),
      t(
        "common.camera_permission_message",
        "Please grant permission to use the camera"
      )
    );
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.7,
  });

  if (!result.canceled) {
    setImageUris((previous) => [
      ...previous,
      result.assets[0].uri,
    ].slice(0, 3));
  }
};

  const validateForm = () => {
    if (!selectedMainCategory) {
      setError(t("complaint.select_category", "Please select a category"));
      return false;
    }
    const selectedCat = categories.find(c => c.name === selectedMainCategory);
    if (selectedCat && selectedCat.subCategories.length > 0 && !selectedSubCategory) {
      setError(t("complaint.select_subcategory", "Please select a subcategory"));
      return false;
    }
    if (!subject.trim()) {
      setError(t("complaint.subject_required", "Subject is required"));
      return false;
    }
    if (!description.trim()) {
      setError(t("complaint.description_required", "Description is required"));
      return false;
    }
    if (description.length > 1000) {
      setError(t("complaint.description_too_long", "Description must be 1000 characters or less"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError("");

    const categoryValue = selectedSubCategory
      ? `${selectedMainCategory} - ${selectedSubCategory}`
      : selectedMainCategory!;

    const complaintData = {
      category: categoryValue,
      orderId: orderId.trim() || undefined,
      subject: subject.trim(),
      description: description.trim(),
      photoUris: imageUris,
    };

    try {
      await submitComplaint(complaintData);
      Alert.alert(
        t("complaint.success_title", "Success"),
        t("complaint.success_message", "Your complaint has been submitted. We will respond within 24 hours."),
        [
          { text: t("common.ok", "OK"), style: "cancel", onPress: () => router.back() },
          {
            text: "View My Complaints",
            onPress: () => router.replace("/profile-page/myComplaintsScreen"),
          },
        ]
      );
    } catch (err: any) {
      setError(err.message || t("complaint.submit_failed", "Submission failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryChip = (categoryName: string, isSub = false) => {
    const isSelected = isSub
      ? selectedSubCategory === categoryName
      : selectedMainCategory === categoryName;
    return (
      <TouchableOpacity
        key={categoryName}
        style={[
          isSub ? styles.subCategoryChip : styles.categoryChip,
          {
            backgroundColor: isSelected
              ? isSub
                ? theme.primary + '20'
                : theme.primary
              : isSub
              ? 'transparent'
              : theme.card,
            borderColor: isSelected
              ? theme.primary
              : theme.border || "#e0e0e0",
          },
        ]}
        onPress={() => {
          if (isSub) {
            setSelectedSubCategory(categoryName);
          } else {
            setSelectedMainCategory(categoryName);
            setSelectedSubCategory(null);
          }
        }}
      >
        <Text
          style={[
            isSub ? styles.subCategoryChipText : styles.categoryChipText,
            {
              color: isSelected
                ? isSub
                  ? theme.primary
                  : "#fff"
                : theme.text,
            },
          ]}
        >
          {categoryName}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loadingCategories) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  const selectedCategoryObj = categories.find(c => c.name === selectedMainCategory);
  const showSubCategories = selectedCategoryObj && selectedCategoryObj.subCategories.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8FA" }}>
      <AppBackground>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header */}
              <View style={styles.headerRow}>
                          <TouchableOpacity
                            style={[
                              styles.backBtn,
                              {
                                backgroundColor: theme.card,
                                borderColor: theme.border,
                              },
                            ]}
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                            hitSlop={{
                              top: 10,
                              bottom: 10,
                              left: 10,
                              right: 10,
                            }}
                          >
                            <Ionicons
                              name="arrow-back"
                              size={r(20)}
                              color={theme.text}
                            />
                          </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  {t("complaint.title", "Raise a Complaint")}
                </Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Contact Options - Matching Design */}
              <View style={styles.contactRow}>
                {/* <TouchableOpacity style={styles.contactCard}>
                  <View style={[styles.contactIconCircle, { backgroundColor: theme.primary + '10' }]}>
                    <Ionicons name="call-outline" size={24} color={theme.primary} />
                  </View>
                  <Text style={[styles.contactCardText, { color: theme.text }]}>{t("common.call", "Call")}</Text>
                </TouchableOpacity> */}

                <TouchableOpacity style={styles.contactCard}>
                  <View style={[styles.contactIconCircle, { backgroundColor: theme.primary + '10' }]}>
                    <Ionicons name="mail-outline" size={24} color={theme.primary} />
                  </View>
                  <Text style={[styles.contactCardText, { color: theme.text }]}>{t("common.email", "Email")}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactCard}>
                  <View style={[styles.contactIconCircle, { backgroundColor: theme.primary + '10' }]}>
                    <Ionicons name="logo-whatsapp" size={24} color={theme.primary} />
                  </View>
                  <Text style={[styles.contactCardText, { color: theme.text }]}>{t("common.whatsapp", "WhatsApp")}</Text>
                </TouchableOpacity>
              </View>

              {/* Info Message */}
              <View style={[styles.infoBox, { borderColor: theme.primary + "40", backgroundColor: theme.primary + "08" }]}>
                <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
                <Text style={[styles.infoBoxText, { color: theme.subText || "#666" }]}>
                  {t("complaint.info_text", "Tell us what went wrong. Our team responds within 24 hours.")}
                </Text>
              </View>

              {/* Dynamic Categories */}
              <Text style={[styles.sectionLabel, { color: theme.text }]}>
                {t("complaint.category", "Category")}
              </Text>
              <View style={styles.categoriesContainer}>
                {categories.map((cat) => renderCategoryChip(cat.name))}
              </View>

              {/* Sub Category - Only when selected main category has subcategories */}
              {showSubCategories && (
                <View style={styles.subCategoriesSection}>
                  <Text style={[styles.subHeading, { color: theme.text }]}>
                    {t("complaint.sub_category", "Sub Category")}
                  </Text>
                  <View style={styles.subCategoriesContainer}>
                    {selectedCategoryObj.subCategories.map((sub) => renderCategoryChip(sub, true))}
                  </View>
                </View>
              )}

              {/* Order ID (optional) */}
              <Text style={[styles.sectionLabel, { color: theme.text }]}>
                {t("complaint.order_id", "Order ID")}{" "}
                <Text style={styles.optionalLabel}>({t("common.optional", "optional")})</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg || theme.card,
                    color: theme.text,
                    borderColor: theme.border || "#e0e0e0",
                  },
                ]}
                placeholder={t("complaint.order_id_placeholder", "e.g. #KOR2451")}
                placeholderTextColor={theme.subText || "#999"}
                value={orderId}
                onChangeText={setOrderId}
              />

              {/* Subject (Required) */}
              <Text style={[styles.sectionLabel, { color: theme.text }]}>
                {t("complaint.subject", "Subject")} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg || theme.card,
                    color: theme.text,
                    borderColor: theme.border || "#e0e0e0",
                  },
                ]}
                placeholder={t("complaint.subject_placeholder", "Brief title for your issue")}
                placeholderTextColor={theme.subText || "#999"}
                value={subject}
                onChangeText={setSubject}
              />

              {/* Description (Required) */}
              <Text style={[styles.sectionLabel, { color: theme.text }]}>
                {t("complaint.description", "Description")} *
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.inputBg || theme.card,
                    color: theme.text,
                    borderColor: theme.border || "#e0e0e0",
                  },
                ]}
                placeholder={t("complaint.description_placeholder", "Please provide detailed information about your issue...")}
                placeholderTextColor={theme.subText || "#999"}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={description}
                onChangeText={(text) => {
                  if (text.length <= 1000) setDescription(text);
                }}
              />
              <Text style={[styles.charCounter, { color: theme.subText || "#999" }]}>
                {description.length}/1000
              </Text>

              {/* Attach Photo — two direct options, no popup */}
              <Text style={[styles.attachLabel, { color: theme.text }]}>
                {t("complaint.attach_photo", "Attach Photo")}
              </Text>
              <View style={styles.photoOptionsRow}>
                <TouchableOpacity
                  style={[
                    styles.photoOptionCard,
                    { backgroundColor: theme.inputBg || theme.card, borderColor: theme.border || "#e0e0e0" },
                  ]}
                  onPress={handleTakePhoto}
                  activeOpacity={0.75}
                >
                  <Ionicons name="camera-outline" size={24} color={theme.primary} />
                  <Text style={[styles.photoOptionText, { color: theme.text }]}>
                    {t("complaint.take_photo", "Take Photo")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.photoOptionCard,
                    { backgroundColor: theme.inputBg || theme.card, borderColor: theme.border || "#e0e0e0" },
                  ]}
                  onPress={handlePickFromGallery}
                  activeOpacity={0.75}
                >
                  <Ionicons name="image-outline" size={24} color={theme.primary} />
                  <Text style={[styles.photoOptionText, { color: theme.text }]}>
                    {t("complaint.choose_from_gallery", "Upload Image")}
                  </Text>
                </TouchableOpacity>
              </View>
             {imageUris.length > 0 && (
  <>
    <Text
      style={{
        color: theme.subText,
        marginBottom: 10,
      }}
    >
      {imageUris.length}/3 images selected
    </Text>

    <View style={styles.previewRow}>
      {imageUris.map((uri, index) => (
        <View
          key={`${uri}-${index}`}
          style={styles.previewContainer}
        >
          <Image
            source={{ uri }}
            style={styles.previewImage}
          />

          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() =>
              setImageUris((previous) =>
                previous.filter((_, i) => i !== index)
              )
            }
          >
            <Ionicons
              name="close-circle"
              size={24}
              color="#ff4444"
            />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  </>
)}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity onPress={handleSubmit} disabled={loading}>
                <LinearGradient
                  colors={theme.gradient || [theme.primary, theme.primary]}
                  style={styles.submitButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {t("complaint.submit", "Submit Complaint")}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
    // justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: {
   width: r(36),
    height: r(36),
    borderRadius: r(18),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginLeft: r(10),
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  contactCard: {
    alignItems: "center",
    width: 80,
  },
  contactIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  contactCardText: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoBoxText: {
    fontSize: 14,
    marginLeft: 10,
    flexShrink: 1,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 16,
  },
  optionalLabel: {
    fontSize: 12,
    fontWeight: "400",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 40,
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  subCategoriesSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  subHeading: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
  },
  subCategoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  subCategoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  subCategoryChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 120,
  },
  charCounter: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 6,
  },
  attachLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  photoOptionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  photoOptionCard: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  photoOptionText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  previewRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 16,
},
  previewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  errorText: {
    color: "#ff4444",
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});