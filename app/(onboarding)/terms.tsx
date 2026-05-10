import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TERMS_SECTIONS = [
  {
    id: "1",
    title: "1. Delivery Timeline / डिलीवरी समय-सीमा",
    clauses: [
      {
        heading: "1.1 Normal Service:",
        text: "Delivery shall be completed within twenty-four (24) to forty-eight (48) hours from confirmation of the order.\nसामान्य सेवा के अंतर्गत, ऑर्डर की पुष्टि के चौबीस (24) से अड़तालीस (48) घंटे के भीतर डिलीवरी पूरी की जाएगी।",
      },
      {
        heading: "1.2 Express Service:",
        text: "Delivery shall be completed on the same day or within twelve (12) hours from confirmation of the order, subject to availability and an additional charge.\nएक्सप्रेस सेवा के अंतर्गत, उपलब्धता के आधार पर ऑर्डर की पुष्टि के उसी दिन या बारह (12) घंटे के भीतर डिलीवरी की जाएगी।",
      },
      {
        heading: "1.3 Delays Beyond Control:",
        text: "The Company shall not be held liable for delays arising due to power failure, machine breakdown, adverse weather conditions, labor issues, or governmental restrictions.\nकंपनी बिजली कटौती, मशीन खराबी, प्रतिकूल मौसम, श्रमिक समस्याओं या सरकारी प्रतिबंधों के कारण होने वाली देरी के लिए उत्तरदायी नहीं होगी।",
      },
    ],
  },
  {
    id: "2",
    title: "2. Payment Terms / भुगतान शर्तें",
    clauses: [
      {
        heading: "2.1 Advance Payment:",
        text: "Full payment shall be made in advance prior to confirmation of the order.\nऑर्डर की पुष्टि से पूर्व पूर्ण भुगतान अग्रिम रूप से किया जाना अनिवार्य है।",
      },
      {
        heading: "2.2 Mode of Payment:",
        text: "Payments shall be accepted exclusively via UPI. All applicable taxes shall be charged as per prevailing laws.\nभुगतान केवल UPI के माध्यम से ही स्वीकार किया जाएगा।",
      },
      {
        heading: "2.3 Billing:",
        text: "Bills or receipts shall be issued electronically or in physical form upon request by the Customer.\nग्राहक के अनुरोध पर बिल या रसीद डिजिटल अथवा भौतिक रूप में प्रदान की जाएगी।",
      },
    ],
  },
  {
    id: "3",
    title: "3. Garment Inspection & Liability / परिधान जांच एवं दायित्व",
    clauses: [
      {
        heading: "3.1 Pocket Check:",
        text: "The Customer shall ensure that all garment pockets are thoroughly checked and emptied prior to handing over the garments.\nग्राहक को कपड़े सौंपने से पूर्व सभी जेबों की जांच कर उन्हें खाली करना अनिवार्य होगा।",
      },
      {
        heading: "3.2 Disclosure:",
        text: "The Customer shall disclose any known stains, color bleeding risks, fabric sensitivity, or special handling instructions at the time of booking.\nग्राहक को बुकिंग के समय किसी भी ज्ञात दाग, रंग छोड़ने की संभावना की जानकारी देना अनिवार्य होगा।",
      },
      {
        heading: "3.3 Exclusion of Liability:",
        text: "The Company shall not be liable for color fading, shrinkage, deformation, damage due to poor fabric quality, or manufacturing defects.\nकंपनी कपड़े के रंग के फीके पड़ने, सिकुड़न, आकार परिवर्तन या निर्माण दोष के लिए उत्तरदायी नहीं होगी।",
      },
    ],
  },
  {
    id: "4",
    title: "4. Damage / Loss Policy / क्षति या हानि नीति",
    clauses: [
      {
        heading: "4.1 Limited Compensation:",
        text: "In case of proven damage or loss due to Company negligence, compensation shall be limited to a maximum of three (3) times the service charge.\nयदि कंपनी की लापरवाही के कारण क्षति सिद्ध होती है, तो मुआवजा अधिकतम सेवा शुल्क के तीन (3) गुना तक सीमित होगा।",
      },
      {
        heading: "4.2 Excluded Causes:",
        text: "No compensation shall be payable for damage due to fabric aging, inherent defects, or circumstances beyond reasonable control.\nकपड़े की उम्र या अंतर्निहित दोष के कारण होने वाली क्षति पर कोई मुआवजा देय नहीं होगा।",
      },
      {
        heading: "4.3 Indirect Loss:",
        text: "The Company shall not be liable for any indirect, incidental, or consequential loss.\nकंपनी किसी भी अप्रत्यक्ष या परिणामी हानि के लिए उत्तरदायी नहीं होगी।",
      },
    ],
  },
  {
    id: "5",
    title: "5. Unclaimed Clothes / बिना लिए गए कपड़े",
    clauses: [
      {
        heading: "5.1 Collection Timeline:",
        text: "Garments must be collected within three (3) days from service completion.\nसेवा पूर्ण होने के तीन (3) दिनों के भीतर कपड़े लेना अनिवार्य है।",
      },
      {
        heading: "5.2 Storage Charges:",
        text: "Storage charges of ₹25 per day shall apply after the stipulated period.\nनिर्धारित अवधि के बाद ₹25 प्रति दिन स्टोरेज शुल्क लागू होगा।",
      },
      {
        heading: "5.3 Disposal Rights:",
        text: "The Company reserves the right to dispose of or donate unclaimed garments after a reasonable period.\nकंपनी को उचित अवधि के बाद बिना लिए गए कपड़ों को नष्ट करने या दान करने का अधिकार होगा।",
      },
    ],
  },
  {
    id: "6",
    title: "6. Customer Complaints / ग्राहक शिकायतें",
    clauses: [
      {
        heading: "6.1 Complaint Window:",
        text: "Complaints must be raised within twenty-four (24) hours of delivery.\nडिलीवरी के चौबीस (24) घंटे के भीतर शिकायत दर्ज कराना अनिवार्य है।",
      },
      {
        heading: "6.2 Usage Restriction:",
        text: "No complaints shall be entertained after garments are worn or rewashed.\nकपड़े पहनने या दोबारा धोने के बाद शिकायत स्वीकार नहीं की जाएगी।",
      },
      {
        heading: "6.3 Deemed Acceptance:",
        text: "Failure to raise a complaint shall be deemed acceptance of service.\nनिर्धारित समय में शिकायत न करने पर सेवा को संतोषजनक माना जाएगा।",
      },
    ],
  },
  {
    id: "7",
    title: "7. Hygiene & Safety / स्वच्छता एवं सुरक्षा",
    clauses: [
      {
        heading: "7.1 Segregated Washing:",
        text: "White and colored garments shall be washed separately.\nसफेद और रंगीन कपड़ों की धुलाई अलग-अलग की जाएगी।",
      },
      {
        heading: "7.2 Stain Disclaimer:",
        text: "Complete stain removal is not guaranteed.\nदाग पूरी तरह हटाने की गारंटी नहीं दी जाती।",
      },
    ],
  },
  {
    id: "8",
    title: "8. Cancellation & Refund / रद्दीकरण एवं धनवापसी",
    clauses: [
      {
        heading: "8.1 Free Cancellation:",
        text: "Orders may be cancelled within two (2) hours of placement if pickup has not started.\nपिकअप शुरू होने से पहले दो (2) घंटे के भीतर रद्दीकरण निःशुल्क होगा।",
      },
      {
        heading: "8.2 Cancellation Charges:",
        text: "Late cancellations shall attract a fee of ₹50.\nदेरी से रद्दीकरण पर ₹50 शुल्क लागू होगा।",
      },
      {
        heading: "8.3 Refund Timeline:",
        text: "Refunds shall be processed within three (3) to seven (7) working days.\nधनवापसी तीन (3) से सात (7) कार्यदिवसों में की जाएगी।",
      },
      {
        heading: "8.4 No Refund After Completion:",
        text: "No refunds shall be issued for completed services unless damage is proven.\nसेवा पूर्ण होने के बाद, क्षति सिद्ध न होने पर कोई धनवापसी नहीं होगी।",
      },
    ],
  },
];

export default function TermsScreen() {
  const [agreed, setAgreed] = useState(false);

  async function handleAgree() {
    if (!agreed) return;
    await AsyncStorage.setItem("termsAccepted", "true");
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4f3" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
          <Text style={styles.headerSubtitle}>Please review before continuing</Text>
        </View>
      </View>

      {/* Welcome Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>🛡️</Text>
        <View>
          <Text style={styles.bannerTitle}>Welcome to KORA.care</Text>
          <Text style={styles.bannerSubtitle}>Your care is our priority</Text>
        </View>
      </View>

      {/* Terms Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.agreementTitle}>KORA.CARE AGREEMENT</Text>

        {TERMS_SECTIONS.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.clauses.map((clause, index) => (
              <View key={index} style={styles.clause}>
                <Text style={styles.clauseHeading}>{clause.heading}</Text>
                <Text style={styles.clauseText}>{clause.text}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Checkbox + Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkboxTick}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read and agree to the{" "}
            <Text style={styles.linkText}>Terms & Conditions</Text> and{" "}
            <Text style={styles.linkText}>Privacy Policy</Text> of KORA.care
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.agreeButton, !agreed && styles.agreeButtonDisabled]}
          onPress={handleAgree}
          activeOpacity={agreed ? 0.8 : 1}
        >
          <Text style={styles.agreeButtonText}>Agree & Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#f0f4f3",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a7a6e",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  bannerIcon: {
    fontSize: 28,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "#b2dfdb",
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  agreementTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 4,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a7a6e",
    marginBottom: 10,
  },
  clause: {
    marginBottom: 10,
  },
  clauseHeading: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 3,
  },
  clauseText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 16,
  },
  footer: {
    backgroundColor: "#f0f4f3",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#1a7a6e",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: "#1a7a6e",
  },
  checkboxTick: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: "#555",
    lineHeight: 18,
  },
  linkText: {
    color: "#1a7a6e",
    fontWeight: "600",
  },
  agreeButton: {
    backgroundColor: "#1a7a6e",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  agreeButtonDisabled: {
    backgroundColor: "#a0c4c0",
  },
  agreeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});