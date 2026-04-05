// import { Redirect } from "expo-router";

// export default function Index() {
//   return <Redirect href="/(auth)/login" />;
// }
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { getToken } from "../src/utils/storage";

export default function Index() {
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await getToken();

    if (token) {
      router.replace("/(tabs)"); // ✅ logged in
    } else {
      router.replace("/(auth)/login"); // ❌ not logged in
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}