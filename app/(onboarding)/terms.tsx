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
import { useTranslation } from "react-i18next";
import i18n from "../../src/translations/i18n";

// Multilingual terms data
 const TERMS_SECTIONS = [
  {
    id: "1",
    title: {
      en: "1. Delivery Timeline",
      hi: "1. डिलीवरी समय-सीमा",
      mr: "1. वितरण वेळापत्रक",
      gu: "1. ડિલિવરી સમયરેખા",
    },
    clauses: [
      {
        heading: {
          en: "1.1 Normal Service:",
          hi: "1.1 सामान्य सेवा:",
          mr: "1.1 सामान्य सेवा:",
          gu: "1.1 સામાન્ય સેવા:",
        },
        text: {
          en: "Delivery shall be completed within twenty-four (24) to forty-eight (48) hours from confirmation of the order.",
          hi: "ऑर्डर की पुष्टि के चौबीस (24) से अड़तालीस (48) घंटे के भीतर डिलीवरी पूरी की जाएगी।",
          mr: "ऑर्डरच्या पुष्टीपासून चोवीस (24) ते अडताळीस (48) तासांच्या आत डिलिव्हरी पूर्ण केली जाईल.",
          gu: "ઓર્ડરની પુષ્ટિ થયાના ચોવીસ (24) થી અડતાળીસ (48) કલાકની અંદર ડિલિવરી પૂર્ણ કરવામાં આવશે.",
        },
      },
      {
        heading: {
          en: "1.2 Express Service:",
          hi: "1.2 एक्सप्रेस सेवा:",
          mr: "1.2 एक्सप्रेस सेवा:",
          gu: "1.2 એક્સપ્રેસ સેવા:",
        },
        text: {
          en: "Delivery shall be completed on the same day or within twelve (12) hours from confirmation of the order, subject to availability and an additional charge.",
          hi: "उपलब्धता के आधार पर ऑर्डर की पुष्टि के उसी दिन या बारह (12) घंटे के भीतर डिलीवरी की जाएगी।",
          mr: "उपलब्धतेनुसार ऑर्डरच्या पुष्टीच त्याच दिवशी किंवा बारा (12) तासांच्या आत डिलिव्हरी पूर्ण केली जाईल.",
          gu: "ઉપલબ્ધતાના આધારે ઓર્ડરની પુષ્ટિના તે જ દિવસે અથવા બાર (12) કલાકની અંદર ડિલિવરી પૂર્ણ કરવામાં આવશે.",
        },
      },
      {
        heading: {
          en: "1.3 Delays Beyond Control:",
          hi: "1.3 नियंत्रण से बाहर देरी:",
          mr: "1.3 नियंत्रणाबाहेर विलंब:",
          gu: "1.3 નિયંત્રણની બહાર વિલંબ:",
        },
        text: {
          en: "The Company shall not be held liable for delays arising due to power failure, machine breakdown, adverse weather conditions, labor issues, or governmental restrictions.",
          hi: "कंपनी बिजली कटौती, मशीन खराबी, प्रतिकूल मौसम, श्रमिक समस्याओं या सरकारी प्रतिबंधों के कारण होने वाली देरी के लिए उत्तरदायी नहीं होगी।",
          mr: "कंपनी वीज पुरवठा खंडित होणे, मशीन बिघाड, प्रतिकूल हवामान, कामगार समस्या किंवा सरकारी निर्बंधांमुळे होणाऱ्या विलंबासाठी जबाबदार राहणार नाही.",
          gu: "કંપની વીજ કાપ, મશીન ખરાબ, પ્રતિકૂળ હવામાન, મજૂર સમસ્યાઓ અથવા સરકારી પ્રતિબંધોને કારણે થતા વિલંબ માટે જવાબદાર રહેશે નહીં.",
        },
      },
    ],
  },
  {
    id: "2",
    title: {
      en: "2. Payment Terms",
      hi: "2. भुगतान शर्तें",
      mr: "2. भुगतान अटी",
      gu: "2. ચુકવણી શરતો",
    },
    clauses: [
      {
        heading: {
          en: "2.1 Advance Payment:",
          hi: "2.1 अग्रिम भुगतान:",
          mr: "2.1 अग्रिम भुगतान:",
          gu: "2.1 અગાઉથી ચુકવણી:",
        },
        text: {
          en: "Full payment shall be made in advance prior to confirmation of the order.",
          hi: "ऑर्डर की पुष्टि से पूर्व पूर्ण भुगतान अग्रिम रूप से किया जाना अनिवार्य है।",
          mr: "ऑर्डरच्या पुष्टीपूर्वी संपूर्ण भुगतान अग्रिम रूपात करणे बंधनकारक आहे.",
          gu: "ઓર્ડરની પુષ્ટિ પહેલાં સંપૂર્ણ ચુકવણી અગાઉથી કરવી ફરજિયાત છે.",
        },
      },
      {
        heading: {
          en: "2.2 Mode of Payment:",
          hi: "2.2 भुगतान का माध्यम:",
          mr: "2.2 भुगतानाची पद्धत:",
          gu: "2.2 ચુકવણીનો માધ્યમ:",
        },
        text: {
          en: "Payments shall be accepted exclusively via UPI. All applicable taxes shall be charged as per prevailing laws.",
          hi: "भुगतान केवल UPI के माध्यम से ही स्वीकार किया जाएगा।",
          mr: "भुगतान केवळ UPI द्वारे स्वीकारले जाईल. सर्व लागू कर प्रचलित कायद्यानुसार आकारले जातील.",
          gu: "ચુકવણી ફક્ત UPI દ્વારા જ સ્વીકારવામાં આવશે. તમામ લાગુ કર પ્રચલિત કાયદાઓ અનુસાર વસૂલવામાં આવશે.",
        },
      },
      {
        heading: {
          en: "2.3 Billing:",
          hi: "2.3 बिलिंग:",
          mr: "2.3 बिलिंग:",
          gu: "2.3 બિલિંગ:",
        },
        text: {
          en: "Bills or receipts shall be issued electronically or in physical form upon request by the Customer.",
          hi: "ग्राहक के अनुरोध पर बिल या रसीद डिजिटल अथवा भौतिक रूप में प्रदान की जाएगी।",
          mr: "ग्राहकाच्या विनंतीनुसार बिल किंवा पावत्या डिजिटल किंवा भौतिक स्वरूपात जारी केल्या जातील.",
          gu: "ગ્રાહકની વિનંતી પર બિલ અથવા રસીદ ડિજિટલ અથવા ભૌતિક સ્વરૂપમાં જારી કરવામાં આવશે.",
        },
      },
    ],
  },
  {
    id: "3",
    title: {
      en: "3. Garment Inspection & Liability",
      hi: "3. परिधान जांच एवं दायित्व",
      mr: "3. वस्त्र तपासणी आणि दायित्व",
      gu: "3. વસ્ત્ર નિરીક્ષણ અને જવાબદારી",
    },
    clauses: [
      {
        heading: {
          en: "3.1 Pocket Check:",
          hi: "3.1 जेब की जांच:",
          mr: "3.1 खिशाची तपासणी:",
          gu: "3.1 ખિસ્સાની તપાસ:",
        },
        text: {
          en: "The Customer shall ensure that all garment pockets are thoroughly checked and emptied prior to handing over the garments.",
          hi: "ग्राहक को कपड़े सौंपने से पूर्व सभी जेबों की जांच कर उन्हें खाली करना अनिवार्य होगा।",
          mr: "ग्राहकाने वस्त्रे सुपूर्द करण्यापूर्वी सर्व खिशांची पूर्ण तपासणी करून ते रिकामे करणे बंधनकारक असेल.",
          gu: "ગ્રાહકે કપડાં સોંપતા પહેલાં તમામ ખિસ્સાની સંપૂર્ણ તપાસ કરી તે ખાલી કરવા ફરજિયાત રહેશે.",
        },
      },
      {
        heading: {
          en: "3.2 Disclosure:",
          hi: "3.2 प्रकटीकरण:",
          mr: "3.2 प्रकटीकरण:",
          gu: "3.2 જાહેરાત:",
        },
        text: {
          en: "The Customer shall disclose any known stains, color bleeding risks, fabric sensitivity, or special handling instructions at the time of booking.",
          hi: "ग्राहक को बुकिंग के समय किसी भी ज्ञात दाग, रंग छोड़ने की संभावना की जानकारी देना अनिवार्य होगा।",
          mr: "ग्राहकाने बुकिंगच्या वेळी कोणतेही ज्ञात डाग, रंग सोडण्याचा धोका, फॅब्रिकची संवेदनशीलता किंवा विशेष हाताळणीच्या सूचना उघड करणे आवश्यक असेल.",
          gu: "ગ્રાહકે બુકિંગ સમયે કોઈપણ જાણીતા ડાઘ, રંગ ફેલાવવાનું જોખમ, ફેબ્રિકની સંવેદનશીલતા અથવા વિશેષ હેન્ડલિંગ સૂચનાઓ જાહેર કરવી ફરજિયાત રહેશે.",
        },
      },
      {
        heading: {
          en: "3.3 Exclusion of Liability:",
          hi: "3.3 दायित्व से छूट:",
          mr: "3.3 दायित्व वगळणे:",
          gu: "3.3 જવાબદારીમાંથી બાકાત:",
        },
        text: {
          en: "The Company shall not be liable for color fading, shrinkage, deformation, damage due to poor fabric quality, or manufacturing defects.",
          hi: "कंपनी कपड़े के रंग के फीके पड़ने, सिकुड़न, आकार परिवर्तन या निर्माण दोष के लिए उत्तरदायी नहीं होगी।",
          mr: "कंपनी रंग फिक्का पडणे, आकुंचन, विकृती, खराब फॅब्रिक गुणवत्ता किंवा उत्पादनातील दोषांमुळे झालेल्या नुकसानीसाठी जबाबदार राहणार नाही.",
          gu: "કંપની રંગ ઝાંખો પડવો, સંકોચન, વિકૃતિ, ફેબ્રિકની નબળી ગુણવત્તા અથવા ઉત્પાદન ખામીને કારણે થતા નુકસાન માટે જવાબદાર રહેશે નહીં.",
        },
      },
    ],
  },
  {
    id: "4",
    title: {
      en: "4. Damage / Loss Policy",
      hi: "4. क्षति या हानि नीति",
      mr: "4. नुकसान / हानी धोरण",
      gu: "4. નુકસાન / હાનિ નીતિ",
    },
    clauses: [
      {
        heading: {
          en: "4.1 Limited Compensation:",
          hi: "4.1 सीमित मुआवजा:",
          mr: "4.1 मर्यादित भरपाई:",
          gu: "4.1 મર્યાદિત વળતર:",
        },
        text: {
          en: "In case of proven damage or loss due to Company negligence, compensation shall be limited to a maximum of three (3) times the service charge.",
          hi: "यदि कंपनी की लापरवाही के कारण क्षति सिद्ध होती है, तो मुआवजा अधिकतम सेवा शुल्क के तीन (3) गुना तक सीमित होगा।",
          mr: "कंपनीच्या निष्काळजीपणामुळे नुकसान सिद्ध झाल्यास, भरपाई सेवा शुल्काच्या कमाल तीन (3) पट इतकी मर्यादित असेल.",
          gu: "જો કંપનીની બેદરકારીને કારણે નુકસાન સાબિત થાય છે, તો વળતર સેવા શુલ્કના વધુમાં વધુ ત્રણ (3) ગણા સુધી મર્યાદિત રહેશે.",
        },
      },
      {
        heading: {
          en: "4.2 Excluded Causes:",
          hi: "4.2 अपवादित कारण:",
          mr: "4.2 वगळलेली कारणे:",
          gu: "4.2 બાકાત કારણો:",
        },
        text: {
          en: "No compensation shall be payable for damage due to fabric aging, inherent defects, or circumstances beyond reasonable control.",
          hi: "कपड़े की उम्र या अंतर्निहित दोष के कारण होने वाली क्षति पर कोई मुआवजा देय नहीं होगा।",
          mr: "फॅब्रिकची वयोमान, अंतर्निहित दोष किंवा वाजवी नियंत्रणाबाहेरील परिस्थितीमुळे झालेल्या नुकसानीसाठी कोणतीही भरपाई देय राहणार नाही.",
          gu: "ફેબ્રિકની ઉંમર, આંતરિક ખામી અથવા વાજબી નિયંત્રણની બહારની પરિસ્થિતિઓને કારણે થતા નુકસાન માટે કોઈ વળતર ચૂકવવાપાત્ર રહેશે નહીં.",
        },
      },
      {
        heading: {
          en: "4.3 Indirect Loss:",
          hi: "4.3 अप्रत्यक्ष हानि:",
          mr: "4.3 अप्रत्यक्ष हानी:",
          gu: "4.3 પરોક્ષ નુકસાન:",
        },
        text: {
          en: "The Company shall not be liable for any indirect, incidental, or consequential loss.",
          hi: "कंपनी किसी भी अप्रत्यक्ष या परिणामी हानि के लिए उत्तरदायी नहीं होगी।",
          mr: "कंपनी कोणत्याही अप्रत्यक्ष, आनुषांगिक किंवा परिणामी हानीसाठी जबाबदार राहणार नाही.",
          gu: "કંપની કોઈપણ પરોક્ષ, આકસ્મિક અથવા પરિણામી નુકસાન માટે જવાબદાર રહેશે નહીં.",
        },
      },
    ],
  },
  {
    id: "5",
    title: {
      en: "5. Unclaimed Clothes",
      hi: "5. बिना लिए गए कपड़े",
      mr: "5. न दावा केलेली वस्त्रे",
      gu: "5. દાવો ન કરાયેલ કપડાં",
    },
    clauses: [
      {
        heading: {
          en: "5.1 Collection Timeline:",
          hi: "5.1 संग्रहण समय सीमा:",
          mr: "5.1 संकलन वेळमर्यादा:",
          gu: "5.1 સંગ્રહ સમયમર્યાદા:",
        },
        text: {
          en: "Garments must be collected within three (3) days from service completion.",
          hi: "सेवा पूर्ण होने के तीन (3) दिनों के भीतर कपड़े लेना अनिवार्य है।",
          mr: "सेवा पूर्ण झाल्यापासून तीन (3) दिवसांच्या आत वस्त्रे गोळा करणे आवश्यक आहे.",
          gu: "સેવા પૂર્ણ થયાના ત્રણ (3) દિવસની અંદર કપડાં એકત્રિત કરવા ફરજિયાત છે.",
        },
      },
      {
        heading: {
          en: "5.2 Storage Charges:",
          hi: "5.2 भंडारण शुल्क:",
          mr: "5.2 स्टोरेज शुल्क:",
          gu: "5.2 સ્ટોરેજ શુલ્ક:",
        },
        text: {
          en: "Storage charges of ₹25 per day shall apply after the stipulated period.",
          hi: "निर्धारित अवधि के बाद ₹25 प्रति दिन स्टोरेज शुल्क लागू होगा।",
          mr: "निर्धारित कालावधीनंतर दररोज ₹25 स्टोरेज शुल्क लागू होईल.",
          gu: "નિર્ધારિત સમયગાળા પછી દરરોજ ₹25 સ્ટોરેજ શુલ્ક લાગુ થશે.",
        },
      },
      {
        heading: {
          en: "5.3 Disposal Rights:",
          hi: "5.3 निपटान के अधिकार:",
          mr: "5.3 विल्हेवाटीचे अधिकार:",
          gu: "5.3 નિકાલના અધિકારો:",
        },
        text: {
          en: "The Company reserves the right to dispose of or donate unclaimed garments after a reasonable period.",
          hi: "कंपनी को उचित अवधि के बाद बिना लिए गए कपड़ों को नष्ट करने या दान करने का अधिकार होगा।",
          mr: "कंपनी वाजवी कालावधीनंतर न दावा केलेल्या वस्त्रांची विल्हेवाट लावण्याचा किंवा दान करण्याचा अधिकार राखून ठेवते.",
          gu: "કંપની વાજબી સમયગાળા પછી દાવો ન કરાયેલ કપડાંનો નિકાલ કરવાનો અથવા દાન કરવાનો અધિકાર સુરક્ષિત રાખે છે.",
        },
      },
    ],
  },
  {
    id: "6",
    title: {
      en: "6. Customer Complaints",
      hi: "6. ग्राहक शिकायतें",
      mr: "6. ग्राहक तक्रारी",
      gu: "6. ગ્રાહક ફરિયાદો",
    },
    clauses: [
      {
        heading: {
          en: "6.1 Complaint Window:",
          hi: "6.1 शिकायत की अवधि:",
          mr: "6.1 तक्रारीची वेळमर्यादा:",
          gu: "6.1 ફરિયાદની સમયમર્યાદા:",
        },
        text: {
          en: "Complaints must be raised within twenty-four (24) hours of delivery.",
          hi: "डिलीवरी के चौबीस (24) घंटे के भीतर शिकायत दर्ज कराना अनिवार्य है।",
          mr: "डिलिव्हरीनंतर चोवीस (24) तासांच्या आत तक्रार नोंदवणे आवश्यक आहे.",
          gu: "ડિલિવરીના ચોવીસ (24) કલાકની અંદર ફરિયાદ નોંધાવવી ફરજિયાત છે.",
        },
      },
      {
        heading: {
          en: "6.2 Usage Restriction:",
          hi: "6.2 उपयोग प्रतिबंध:",
          mr: "6.2 वापर निर्बंध:",
          gu: "6.2 ઉપયોગ પ્રતિબંધ:",
        },
        text: {
          en: "No complaints shall be entertained after garments are worn or rewashed.",
          hi: "कपड़े पहनने या दोबारा धोने के बाद शिकायत स्वीकार नहीं की जाएगी।",
          mr: "वस्त्रे परिधान केल्यानंतर किंवा पुन्हा धुतल्यानंतर कोणतीही तक्रार स्वीकारली जाणार नाही.",
          gu: "કપડાં પહેર્યા પછી અથવા ફરીથી ધોયા પછી કોઈ ફરિયાદ સ્વીકારવામાં આવશે નહીં.",
        },
      },
      {
        heading: {
          en: "6.3 Deemed Acceptance:",
          hi: "6.3 स्वीकृति मानी जाएगी:",
          mr: "6.3 स्वीकारले गेले मानले जाईल:",
          gu: "6.3 સ્વીકૃતિ ગણવામાં આવશે:",
        },
        text: {
          en: "Failure to raise a complaint shall be deemed acceptance of service.",
          hi: "निर्धारित समय में शिकायत न करने पर सेवा को संतोषजनक माना जाएगा।",
          mr: "निर्धारित वेळेत तक्रार न केल्यास सेवा स्वीकारली गेली असे मानले जाईल.",
          gu: "નિર્ધારિત સમયમાં ફરિયાદ ન કરવા પર સેવાને સ્વીકૃત ગણવામાં આવશે.",
        },
      },
    ],
  },
  {
    id: "7",
    title: {
      en: "7. Hygiene & Safety",
      hi: "7. स्वच्छता एवं सुरक्षा",
      mr: "7. स्वच्छता आणि सुरक्षा",
      gu: "7. સ્વચ્છતા અને સલામતી",
    },
    clauses: [
      {
        heading: {
          en: "7.1 Segregated Washing:",
          hi: "7.1 अलग-अलग धुलाई:",
          mr: "7.1 विभक्त धुणे:",
          gu: "7.1 અલગ ધોવા:",
        },
        text: {
          en: "White and colored garments shall be washed separately.",
          hi: "सफेद और रंगीन कपड़ों की धुलाई अलग-अलग की जाएगी।",
          mr: "पांढरी आणि रंगीत वस्त्रे वेगळी धुतली जातील.",
          gu: "સફેદ અને રંગીન કપડાં અલગ-અલગ ધોવામાં આવશે.",
        },
      },
      {
        heading: {
          en: "7.2 Stain Disclaimer:",
          hi: "7.2 दाग हटाने की गारंटी नहीं:",
          mr: "7.2 डाग काढण्याची हमी नाही:",
          gu: "7.2 ડાઘ દૂર કરવાની ગેરંટી નથી:",
        },
        text: {
          en: "Complete stain removal is not guaranteed.",
          hi: "दाग पूरी तरह हटाने की गारंटी नहीं दी जाती।",
          mr: "संपूर्ण डाग काढून टाकल्याची हमी दिली जात नाही.",
          gu: "સંપૂર્ણ ડાઘ દૂર કરવાની બાંયધરી આપવામાં આવતી નથી.",
        },
      },
    ],
  },
  {
    id: "8",
    title: {
      en: "8. Cancellation & Refund",
      hi: "8. रद्दीकरण एवं धनवापसी",
      mr: "8. रद्द करणे आणि परतावा",
      gu: "8. રદ અને ચુકવણી પરત",
    },
    clauses: [
      {
        heading: {
          en: "8.1 Free Cancellation:",
          hi: "8.1 निःशुल्क रद्दीकरण:",
          mr: "8.1 विनामूल्य रद्द करणे:",
          gu: "8.1 મફત રદ:",
        },
        text: {
          en: "Orders may be cancelled within two (2) hours of placement if pickup has not started.",
          hi: "पिकअप शुरू होने से पहले दो (2) घंटे के भीतर रद्दीकरण निःशुल्क होगा।",
          mr: "पिकअप सुरू झाला नसेल तर ऑर्डर दिल्यानंतर दोन (2) तासांच्या आत ऑर्डर रद्द केली जाऊ शकते.",
          gu: "પિકઅપ શરૂ ન થયું હોય તો ઓર્ડર મૂક્યાના બે (2) કલાકની અંદર ઓર્ડર રદ કરી શકાય છે.",
        },
      },
      {
        heading: {
          en: "8.2 Cancellation Charges:",
          hi: "8.2 रद्दीकरण शुल्क:",
          mr: "8.2 रद्द शुल्क:",
          gu: "8.2 રદ શુલ્ક:",
        },
        text: {
          en: "Late cancellations shall attract a fee of ₹50.",
          hi: "देरी से रद्दीकरण पर ₹50 शुल्क लागू होगा।",
          mr: "उशीरा रद्द केल्यास ₹50 शुल्क आकारले जाईल.",
          gu: "મોડું રદ કરવા પર ₹50 શુલ્ક લાગશે.",
        },
      },
      {
        heading: {
          en: "8.3 Refund Timeline:",
          hi: "8.3 धनवापसी की अवधि:",
          mr: "8.3 परतावा वेळमर्यादा:",
          gu: "8.3 ચુકવણી પરત સમયમર્યાદા:",
        },
        text: {
          en: "Refunds shall be processed within three (3) to seven (7) working days.",
          hi: "धनवापसी तीन (3) से सात (7) कार्यदिवसों में की जाएगी।",
          mr: "परतावा तीन (3) ते सात (7) कामकाजी दिवसांत प्रक्रिया केला जाईल.",
          gu: "ચુકવણી પરત ત્રણ (3) થી સાત (7) કામકાજના દિવસોમાં પ્રક્રિયા કરવામાં આવશે.",
        },
      },
      {
        heading: {
          en: "8.4 No Refund After Completion:",
          hi: "8.4 पूर्ण होने के बाद धनवापसी नहीं:",
          mr: "8.4 पूर्ण झाल्यानंतर परतावा नाही:",
          gu: "8.4 પૂર્ણ થયા પછી કોઈ ચુકવણી પરત નહીં:",
        },
        text: {
          en: "No refunds shall be issued for completed services unless damage is proven.",
          hi: "सेवा पूर्ण होने के बाद, क्षति सिद्ध न होने पर कोई धनवापसी नहीं होगी।",
          mr: "सेवा पूर्ण झाल्यानंतर, नुकसान सिद्ध झाल्याशिवाय कोणताही परतावा जारी केला जाणार नाही.",
          gu: "સેવા પૂર્ણ થયા પછી, નુકસાન સાબિત ન થાય ત્યાં સુધી કોઈ ચુકવણી પરત જારી કરવામાં આવશે નહીં.",
        },
      },
    ],
  },
];

export default function TermsScreen() {
  const { t } = useTranslation();
  const [agreed, setAgreed] = useState(false);
  const currentLang = i18n.language; // 'en', 'hi', 'mr', 'gu'

  // Helper to get text based on current language (fallback to English if missing)
  const getLocalizedText = (obj: any) => {
    if (obj[currentLang]) return obj[currentLang];
    return obj.en || "";
  };

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
          <Text style={styles.headerTitle}>{t("terms.title")}</Text>
          <Text style={styles.headerSubtitle}>{t("terms.subtitle")}</Text>
        </View>
      </View>

      {/* Welcome Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>🛡️</Text>
        <View>
          <Text style={styles.bannerTitle}>{t("app_name")}</Text>
          <Text style={styles.bannerSubtitle}>{t("branding.your_care")}</Text>
        </View>
      </View>

      {/* Terms Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.agreementTitle}>{t("terms.agreement_title")}</Text>

        {TERMS_SECTIONS.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{getLocalizedText(section.title)}</Text>
            {section.clauses.map((clause, index) => (
              <View key={index} style={styles.clause}>
                <Text style={styles.clauseHeading}>{getLocalizedText(clause.heading)}</Text>
                <Text style={styles.clauseText}>{getLocalizedText(clause.text)}</Text>
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
            {t("terms.agree_checkbox_prefix")}{" "}
            <Text style={styles.linkText}>{t("terms.agree_checkbox_terms")}</Text>{" "}
            {t("terms.agree_checkbox_and")}{" "}
            <Text style={styles.linkText}>{t("terms.agree_checkbox_privacy")}</Text>{" "}
            {t("terms.agree_checkbox_suffix")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.agreeButton, !agreed && styles.agreeButtonDisabled]}
          onPress={handleAgree}
          activeOpacity={agreed ? 0.8 : 1}
        >
          <Text style={styles.agreeButtonText}>{t("terms.agree_button")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f3" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, backgroundColor: "#f0f4f3" },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  headerSubtitle: { fontSize: 12, color: "#999", marginTop: 2 },
  banner: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a7a6e", marginHorizontal: 16, borderRadius: 12, padding: 14, gap: 12, marginBottom: 12 },
  bannerIcon: { fontSize: 28 },
  bannerTitle: { fontSize: 15, fontWeight: "700", color: "#fff" },
  bannerSubtitle: { fontSize: 12, color: "#b2dfdb", marginTop: 2 },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  agreementTitle: { fontSize: 13, fontWeight: "700", color: "#555", letterSpacing: 1, marginBottom: 12, marginTop: 4 },
  section: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1a7a6e", marginBottom: 10 },
  clause: { marginBottom: 10 },
  clauseHeading: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 3 },
  clauseText: { fontSize: 12, color: "#666", lineHeight: 18 },
  bottomSpacing: { height: 16 },
  footer: { backgroundColor: "#f0f4f3", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: "#e0e0e0" },
  checkboxRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12, gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: "#1a7a6e", justifyContent: "center", alignItems: "center", marginTop: 1, flexShrink: 0 },
  checkboxChecked: { backgroundColor: "#1a7a6e" },
  checkboxTick: { color: "#fff", fontSize: 12, fontWeight: "700" },
  checkboxLabel: { flex: 1, fontSize: 12, color: "#555", lineHeight: 18 },
  linkText: { color: "#1a7a6e", fontWeight: "600" },
  agreeButton: { backgroundColor: "#1a7a6e", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  agreeButtonDisabled: { backgroundColor: "#a0c4c0" },
  agreeButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});