import * as Notifications from "expo-notifications";
import type { Subscription } from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { requestJson } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerPushNotifications(token: string) {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined;

  const expoToken = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
  await requestJson("/api/notifications/tokens", {
    method: "POST",
    token,
    body: {
      token: expoToken,
      platform: Platform.OS,
      deviceLabel: `${Platform.OS}-${Constants.deviceName ?? "device"}`,
    },
  });
}

export async function getInitialNotificationPath() {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) {
    return null;
  }
  return extractPathFromNotificationData(response.notification.request.content.data);
}

export function subscribeNotificationNavigation(onPath: (path: string) => void) {
  const subscription: Subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const path = extractPathFromNotificationData(response.notification.request.content.data);
    if (path) {
      onPath(path);
    }
  });
  return () => {
    subscription.remove();
  };
}

function extractPathFromNotificationData(data: Record<string, unknown> | null | undefined) {
  if (!data) {
    return null;
  }
  const recipeSlug = typeof data.recipeSlug === "string" ? data.recipeSlug : null;
  if (recipeSlug) {
    return `/recipe/${recipeSlug}`;
  }
  return null;
}
