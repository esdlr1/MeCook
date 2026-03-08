import { Stack } from "expo-router";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../src/contexts/AuthContext";
import { SideMenuProvider } from "../src/contexts/SideMenuContext";
import { getInitialNotificationPath, subscribeNotificationNavigation } from "../src/lib/notifications";
import { colors } from "../src/theme/tokens";

const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = subscribeNotificationNavigation((path) => {
      router.push(path as never);
    });
    void getInitialNotificationPath().then((path) => {
      if (path) {
        router.push(path as never);
      }
    });
    return unsubscribe;
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SideMenuProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                contentStyle: { backgroundColor: colors.bg },
                animation: "fade",
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth/login" options={{ title: "Sign In" }} />
              <Stack.Screen name="auth/signup" options={{ title: "Create Account" }} />
              <Stack.Screen name="onboarding/preferences" options={{ title: "Onboarding" }} />
              <Stack.Screen name="settings/notifications" options={{ title: "Notification Preferences" }} />
              <Stack.Screen name="recipe/[id]" options={{ title: "Recipe" }} />
              <Stack.Screen name="recipe/[id]/ingredients" options={{ title: "Ingredients" }} />
              <Stack.Screen name="recipe/[id]/method" options={{ title: "How to Cook it" }} />
              <Stack.Screen name="recipe/[id]/guided" options={{ title: "Guided Cook", headerShown: true }} />
              <Stack.Screen name="ingredient/[name]" options={{ headerShown: false }} />
              <Stack.Screen name="creator/apply" options={{ title: "Creator Verification" }} />
              <Stack.Screen name="creator/dashboard" options={{ title: "Creator Dashboard" }} />
              <Stack.Screen name="admin/moderation" options={{ title: "Moderation Queue" }} />
              <Stack.Screen name="creator/publish" options={{ title: "Create Recipe" }} />
              <Stack.Screen name="menu/profile" options={{ title: "Profile" }} />
              <Stack.Screen name="menu/network" options={{ title: "My Network" }} />
              <Stack.Screen name="menu/recipe-stats" options={{ title: "Recipe Stats" }} />
              <Stack.Screen name="menu/recently-viewed" options={{ title: "Recently Viewed" }} />
              <Stack.Screen name="menu/premium" options={{ title: "Premium" }} />
              <Stack.Screen name="menu/challenges" options={{ title: "Challenges" }} />
              <Stack.Screen name="menu/settings" options={{ title: "Settings" }} />
              <Stack.Screen name="menu/faq" options={{ title: "Frequently Asked Questions" }} />
              <Stack.Screen name="menu/feedback" options={{ title: "Send feedback" }} />
            </Stack>
          </SideMenuProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
