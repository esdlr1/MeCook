export function redirectSystemPath({ path }: { path: string }) {
  // Normalize web and custom deep links into expo-router paths.
  if (path.startsWith("https://mecook.app/recipe/")) {
    const slug = path.replace("https://mecook.app/recipe/", "").split("?")[0];
    return `/recipe/${slug}`;
  }
  if (path.startsWith("mecook://recipe/")) {
    const slug = path.replace("mecook://recipe/", "").split("?")[0];
    return `/recipe/${slug}`;
  }
  return path;
}
