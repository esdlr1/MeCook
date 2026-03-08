import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createContext, useContext, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PanResponderGestureState,
  PanResponder,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "./AuthContext";
import { colors, radius, spacing, typography } from "../theme/tokens";

type SideMenuContextValue = {
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
};

const SideMenuContext = createContext<SideMenuContextValue | undefined>(undefined);
const DRAWER_WIDTH = 300;

type MenuItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const MENU_ITEMS: MenuItem[] = [
  { label: "Profile", icon: "person-outline", route: "/menu/profile" },
  { label: "My Network", icon: "people-outline", route: "/menu/network" },
  { label: "Recipe Stats", icon: "stats-chart-outline", route: "/menu/recipe-stats" },
  { label: "Your recently viewed recipes", icon: "time-outline", route: "/menu/recently-viewed" },
  { label: "Premium", icon: "bookmark-outline", route: "/menu/premium" },
  { label: "Challenges", icon: "trophy-outline", route: "/menu/challenges" },
  { label: "Settings", icon: "settings-outline", route: "/menu/settings" },
  { label: "Frequently Asked Questions", icon: "help-circle-outline", route: "/menu/faq" },
  { label: "Send feedback", icon: "paper-plane-outline", route: "/menu/feedback" },
];

const EDGE_WIDTH = 36;
const SWIPE_DX_THRESHOLD = 14;

function getInitials(name?: string) {
  if (!name) return "M";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SideMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const openMenu = () => {
    setOpen(true);
    Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: -DRAWER_WIDTH, duration: 180, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        setOpen(false);
      }
    });
  };

  const toggleMenu = () => {
    if (open) closeMenu();
    else openMenu();
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture: PanResponderGestureState) =>
          !open && gesture.moveX < 22 && gesture.dx > 16 && Math.abs(gesture.dy) < 16,
        onPanResponderRelease: () => {
          if (!open) {
            openMenu();
          }
        },
      }),
    [open],
  );

  const value = useMemo<SideMenuContextValue>(
    () => ({
      openMenu,
      closeMenu,
      toggleMenu,
    }),
    [open],
  );

  return (
    <SideMenuContext.Provider value={value}>
      <View style={styles.root}>
        <View style={styles.content}>{children}</View>

        <View pointerEvents="box-only" style={styles.edgeHitArea} {...responder.panHandlers} />

        {open ? (
          <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
            </Animated.View>
            <Animated.View
              style={[
                styles.drawer,
                {
                  paddingTop: insets.top + 12,
                  paddingBottom: insets.bottom + 12,
                  transform: [{ translateX }],
                },
              ]}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(user?.displayName)}</Text>
                  </View>
                  <Pressable style={styles.headerIconBtn}>
                    <Ionicons name="notifications-outline" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>
                <View style={styles.userRow}>
                  <Text style={styles.name}>{user?.displayName ?? "MeCook User"}</Text>
                  <Text style={styles.handle}>@{user?.email?.split("@")[0] ?? "cook_user"}</Text>
                  <View style={styles.followRow}>
                    <Text style={styles.followStat}>0 Followers</Text>
                    <Text style={styles.followStat}>0 Following</Text>
                  </View>
                </View>

                <View style={styles.itemsWrap}>
                  {MENU_ITEMS.map((item) => (
                    <Pressable
                      key={item.label}
                      style={styles.menuItem}
                      onPress={() => {
                        closeMenu();
                        router.push(item.route as never);
                      }}
                    >
                      <Ionicons name={item.icon} size={22} color={colors.text} />
                      <Text style={styles.menuLabel}>{item.label}</Text>
                    </Pressable>
                  ))}

                <View style={styles.signOutWrap}>
                  <Pressable
                    style={styles.signOutButton}
                    onPress={() => {
                      closeMenu();
                      void signOut();
                    }}
                  >
                    <Ionicons name="log-out-outline" size={22} color={colors.text} />
                    <Text style={styles.menuLabel}>Sign out</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        ) : null}
      </View>
    </SideMenuContext.Provider>
  );
}

export function useSideMenu() {
  const ctx = useContext(SideMenuContext);
  if (!ctx) {
    throw new Error("useSideMenu must be used within SideMenuProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  edgeHitArea: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: EDGE_WIDTH,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: colors.bg,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: colors.border,
  },
  userRow: {
    gap: 8,
    marginBottom: 26,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#a855f7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: typography.h4,
  },
  name: {
    color: colors.text,
    fontSize: typography.h4,
    fontWeight: "700",
  },
  handle: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginTop: 1,
  },
  followRow: {
    flexDirection: "row",
    gap: 44,
    marginTop: 8,
  },
  followStat: {
    color: colors.text,
    fontWeight: "700",
    fontSize: typography.body,
  },
  itemsWrap: {
    gap: 14,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 3,
  },
  menuLabel: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: "700",
    flexShrink: 1,
    lineHeight: 28,
  },
  signOutWrap: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
});
