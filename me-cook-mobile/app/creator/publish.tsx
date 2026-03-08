import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { requestJson, uploadImage, uploadVideoChunk } from "../../src/lib/api";
import { apiUrl } from "../../src/lib/api";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

type StepMedia = { type: "image"; uri: string } | { type: "video"; uri: string } | null;

export default function CreatorPublishScreen() {
  const { token, user } = useAuth();
  const [title, setTitle] = useState("");
  const [ingredientText, setIngredientText] = useState("");
  const [stepText, setStepText] = useState("");
  const [heroImageUri, setHeroImageUri] = useState<string | null>(null);
  const [stepMedia, setStepMedia] = useState<Record<number, StepMedia>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const stepLines = stepText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera permission required", "Please allow camera access to take photos and record videos.");
      return false;
    }
    return true;
  };

  const takeHeroPhoto = async () => {
    if (!(await requestCameraPermission())) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets[0]) {
      setHeroImageUri(result.assets[0].uri);
    }
  };

  const pickHeroPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets[0]) {
      setHeroImageUri(result.assets[0].uri);
    }
  };

  const takeStepPhoto = async (stepIndex: number) => {
    if (!(await requestCameraPermission())) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setStepMedia((prev) => ({ ...prev, [stepIndex]: { type: "image", uri: result.assets[0].uri } }));
    }
  };

  const recordStepVideo = async (stepIndex: number) => {
    if (!(await requestCameraPermission())) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: 60,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setStepMedia((prev) => ({ ...prev, [stepIndex]: { type: "video", uri: result.assets[0].uri } }));
    }
  };

  const clearStepMedia = (stepIndex: number) => {
    setStepMedia((prev) => {
      const next = { ...prev };
      delete next[stepIndex];
      return next;
    });
  };

  const publishRecipe = async () => {
    if (!token) {
      Alert.alert("Sign in required", "Please sign in first.");
      return;
    }
    if (user?.role !== "VERIFIED_CREATOR" && user?.role !== "ADMIN") {
      Alert.alert("Creator access required", "Your account must be verified to publish.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Title required", "Add a recipe title before publishing.");
      return;
    }
    if (stepLines.length === 0) {
      Alert.alert("Steps required", "Add at least one How to Cook it step.");
      return;
    }
    setUploading(true);
    try {
      let progress = 0;
      const setProg = (p: number) => {
        setUploadProgress(p);
        progress = p;
      };

      let heroImageUrl: string | undefined;
      if (heroImageUri) {
        const res = await uploadImage(heroImageUri, token);
        heroImageUrl = res.originalUrl.startsWith("http") ? res.originalUrl : `${apiUrl("")}${res.originalUrl}`;
        setProg(10);
      }

      const mediaIdsByStep: Record<number, string> = {};
      const totalMedia = Object.keys(stepMedia).length;
      let done = 0;
      for (const key of Object.keys(stepMedia)) {
        const stepIndex = Number(key);
        const media = stepMedia[stepIndex];
        if (!media) continue;
        if (media.type === "image") {
          const res = await uploadImage(media.uri, token);
          mediaIdsByStep[stepIndex] = res.id;
        } else {
          const videoResponse = await fetch(media.uri);
          const videoBlob = await videoResponse.blob();
          const fileName = media.uri.split("/").pop() ?? `step-${stepIndex}-${Date.now()}.mp4`;
          const session = await requestJson<{ sessionId: string; chunkSizeBytes: number; totalChunks: number }>(
            "/api/media/videos/sessions",
            {
              method: "POST",
              token,
              body: { fileName, mimeType: "video/mp4", totalBytes: videoBlob.size },
            },
          );
          for (let i = 0; i < session.totalChunks; i += 1) {
            const start = i * session.chunkSizeBytes;
            const end = Math.min(start + session.chunkSizeBytes, videoBlob.size);
            const chunk = videoBlob.slice(start, end);
            await uploadVideoChunk(session.sessionId, i, chunk, token);
          }
          const complete = await requestJson<{ mediaAssetId: string }>(
            `/api/media/videos/sessions/${session.sessionId}/complete`,
            { method: "POST", token },
          );
          mediaIdsByStep[stepIndex] = complete.mediaAssetId;
        }
        done += 1;
        setProg(10 + Math.floor((done / totalMedia) * 60));
      }

      setProg(75);
      const ingredients = ingredientText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => ({ itemName: line }));
      const steps = stepLines.map((instruction, index) => ({
        instruction,
        mediaAssetId: mediaIdsByStep[index],
      }));

      const recipe = await requestJson<{ id: string; slug: string }>("/api/recipes", {
        method: "POST",
        token,
        body: {
          title: title.trim(),
          summary: "Created in MeCook Creator Studio",
          cookTimeMinutes: 25,
          servings: 4,
          heroImageUrl,
          ingredients,
          steps,
          tags: ["creator-upload"],
        },
      });

      await requestJson(`/api/recipes/${recipe.id}/submit-for-review`, {
        method: "POST",
        token,
      });

      setUploadProgress(100);
      Alert.alert("Submitted", `Recipe "${recipe.slug}" is now in moderation review.`);
    } catch (error) {
      Alert.alert("Upload failed", (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create New Recipe</Text>

      <View style={styles.toolsSection}>
        <Text style={styles.toolsTitle}>Creator tools</Text>
        <Text style={styles.toolsSubtitle}>Use these while building your recipe. Customize with photos and videos.</Text>
        <View style={styles.toolsGrid}>
          <Pressable style={styles.toolCard} onPress={takeHeroPhoto}>
            <Ionicons name="camera-outline" size={28} color={colors.accent} />
            <Text style={styles.toolLabel}>Take hero photo</Text>
            <Text style={styles.toolHint}>Cover image for your recipe</Text>
          </Pressable>
          <Pressable style={styles.toolCard} onPress={pickHeroPhoto}>
            <Ionicons name="images-outline" size={28} color={colors.accent} />
            <Text style={styles.toolLabel}>Pick hero photo</Text>
            <Text style={styles.toolHint}>Choose from gallery</Text>
          </Pressable>
          <Pressable
            style={styles.toolCard}
            onPress={() => (stepLines.length > 0 ? takeStepPhoto(0) : Alert.alert("Add steps first", "Add at least one step in the text area below, then add a photo to any step."))}
          >
            <Ionicons name="image-outline" size={28} color={colors.accent} />
            <Text style={styles.toolLabel}>Step photo</Text>
            <Text style={styles.toolHint}>Photo for a step</Text>
          </Pressable>
          <Pressable
            style={styles.toolCard}
            onPress={() => (stepLines.length > 0 ? recordStepVideo(0) : Alert.alert("Add steps first", "Add at least one step below, then add a video to any step."))}
          >
            <Ionicons name="videocam-outline" size={28} color={colors.accent} />
            <Text style={styles.toolLabel}>Record step video</Text>
            <Text style={styles.toolHint}>Video for a step</Text>
          </Pressable>
        </View>
      </View>

      {heroImageUri ? (
        <View style={styles.heroRow}>
          <Text style={styles.heroLabel}>Hero image set</Text>
          <Pressable onPress={() => setHeroImageUri(null)} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Remove</Text>
          </Pressable>
        </View>
      ) : null}

      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Recipe title"
        placeholderTextColor={colors.textMuted}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        value={ingredientText}
        onChangeText={setIngredientText}
        multiline
        placeholder="Ingredients (one per line)"
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.stepLabel}>How to Cook it (one instruction per line)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={stepText}
        onChangeText={setStepText}
        multiline
        placeholder="Step 1: ...&#10;Step 2: ..."
        placeholderTextColor={colors.textMuted}
      />

      {stepLines.length > 0 ? (
        <View style={styles.stepMediaSection}>
          <Text style={styles.stepMediaTitle}>Add photo or video to a step</Text>
          {stepLines.map((instruction, index) => (
            <View key={index} style={styles.stepRow}>
              <Text numberOfLines={1} style={styles.stepRowLabel}>
                Step {index + 1}: {instruction.slice(0, 30)}{instruction.length > 30 ? "…" : ""}
              </Text>
              <View style={styles.stepRowActions}>
                {stepMedia[index] ? (
                  <>
                    <Text style={styles.stepMediaBadge}>{stepMedia[index]!.type === "video" ? "Video" : "Photo"}</Text>
                    <Pressable onPress={() => clearStepMedia(index)} style={styles.smallBtn}>
                      <Text style={styles.smallBtnText}>Clear</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable onPress={() => takeStepPhoto(index)} style={styles.smallBtn}>
                      <Ionicons name="image-outline" size={16} color={colors.text} />
                      <Text style={styles.smallBtnText}>Photo</Text>
                    </Pressable>
                    <Pressable onPress={() => recordStepVideo(index)} style={styles.smallBtn}>
                      <Ionicons name="videocam-outline" size={16} color={colors.text} />
                      <Text style={styles.smallBtnText}>Video</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable style={styles.button} onPress={publishRecipe} disabled={uploading}>
        <Text style={styles.buttonText}>{uploading ? `Publishing… ${uploadProgress}%` : "Upload + Publish"}</Text>
      </Pressable>
      <Text style={styles.note}>
        Use the creator tools above to add a hero photo and step photos or videos. Publishing is limited to verified creators.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 120,
  },
  title: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: "700",
  },
  toolsSection: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 8,
  },
  toolsTitle: {
    color: colors.text,
    fontSize: typography.h4,
    fontWeight: "700",
  },
  toolsSubtitle: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 18,
  },
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  toolCard: {
    minWidth: "47%",
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  toolLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  toolHint: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroLabel: {
    color: colors.accent,
    fontSize: typography.body,
    fontWeight: "600",
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearBtnText: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    color: colors.text,
    padding: 12,
    fontSize: typography.body,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  stepLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "600",
  },
  stepMediaSection: {
    gap: 10,
    marginTop: 4,
  },
  stepMediaTitle: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "600",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepRowLabel: {
    color: colors.text,
    fontSize: typography.small,
    flex: 1,
    minWidth: 0,
  },
  stepRowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepMediaBadge: {
    color: colors.accent,
    fontSize: typography.small,
    fontWeight: "600",
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallBtnText: {
    color: colors.text,
    fontSize: typography.small,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: colors.bg,
    fontWeight: "700",
    fontSize: typography.body,
  },
  note: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 20,
  },
});
