import { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import axios from "axios";
import { useTheme } from "../../src/theme/ThemeProvider";
import { handleSuccessfulLogin } from "../../src/utils/authHelpers";
import { getUser } from "../../src/utils/storage";

const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN!;
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID!;

const redirectUri = AuthSession.makeRedirectUri({
  scheme: "koraapp",
  path: "callback",
});

const discovery = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
};

// This is the ONLY place the Google login redirect is processed.
// email-login.tsx just opens the browser (promptAsync) and otherwise
// leaves this screen to do the code exchange, backend call, profile
// save, and navigation — exactly once, with no other listener racing it.
export default function Callback() {
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ code?: string; error?: string }>();
  const [errorMsg, setErrorMsg] = useState("");
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return; // guard against double-invoke (Fast Refresh, re-render)
    ranOnce.current = true;

    const run = async () => {
      try {
        if (params.error) {
          throw new Error(String(params.error));
        }
        const code = params.code;
        if (!code) {
          throw new Error("No authorization code in redirect");
        }

        const codeVerifier = await AsyncStorage.getItem("auth0_code_verifier");
        if (!codeVerifier) {
          throw new Error("Missing PKCE code verifier — please try logging in again");
        }
        // Consume it immediately so a duplicate delivery of the same
        // redirect can't attempt a second exchange with a stale verifier.
        await AsyncStorage.removeItem("auth0_code_verifier");

        const tokenRes = await AuthSession.exchangeCodeAsync(
          {
            clientId: AUTH0_CLIENT_ID,
            code: String(code),
            redirectUri,
            extraParams: { code_verifier: codeVerifier },
          },
          discovery
        );

        const idToken = tokenRes.idToken;
        if (!idToken) throw new Error("No idToken received from Auth0");

        const res = await axios.post(
          "https://koraapp-backend.onrender.com/api/auth/google-auth",
          { idToken }
        );

        if (!res.data?.token) {
          throw new Error("Invalid server response");
        }

        await AsyncStorage.setItem("token", res.data.token);
        // Wait for the FULL profile (including name) to be saved before
        // navigating — this is what fixes the "Guest" name flash.
        await handleSuccessfulLogin(res.data.token, res.data.user?.role);

        // Google accounts never have a mobile number yet — riders need one
        // to contact the customer. Send them to a short onboarding step to
        // collect it (unverified, just required) before letting them in.
        const cachedUser = await getUser();
        // Clear the entire pre-login stack (welcome/language/login/
        // email-login/callback screens) so back-navigation from home can't
        // walk backward into them — this is what was causing back presses
        // to eventually land back on the login screen after a Google login.
        if (router.canDismiss()) router.dismissAll();
        if (!cachedUser?.mobile) {
          router.replace("/onboarding-mobile");
        } else {
          router.replace("/(tabs)/home");
        }
      } catch (err: any) {
        console.log("Google Login Error:", err?.response?.data || err?.message || err);
        setErrorMsg(
          err?.message === "No authorization code in redirect"
            ? "Google login was cancelled."
            : "Google login failed. Please try again."
        );
        // Give the user a moment to see the message, then send them back.
        setTimeout(() => {
          router.replace({
            pathname: "/(auth)/email-login",
            params: { googleError: "1" },
          });
        }, 1500);
      }
    };

    run();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator color={theme.primary} size="large" />
      {errorMsg ? (
        <Text style={[styles.errorText, { color: theme.text }]}>{errorMsg}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 14, textAlign: "center", paddingHorizontal: 24 },
});