import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

export default function OTPScreen() {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{t("stub_screens.otp_screen")}</Text>
    </View>
  );
}
