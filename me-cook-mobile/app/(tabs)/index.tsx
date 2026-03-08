import { Redirect } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";

export default function IndexRoute() {
  const { loading, isAuthenticated, user } = useAuth();
  if (loading) {
    return null;
  }
  if (isAuthenticated && !user?.onboardingCompleted) {
    return <Redirect href="/onboarding/preferences" />;
  }
  return <Redirect href="/(tabs)/search" />;
}
