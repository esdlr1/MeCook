const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_FALLBACK_URL = process.env.EXPO_PUBLIC_API_FALLBACK_URL;

function getApiBaseUrls() {
  const urls = [API_URL, API_FALLBACK_URL]
    .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    .map((url) => url.replace(/\/+$/, ""));
  const unique = Array.from(new Set(urls));
  if (unique.length === 0) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured");
  }
  return unique;
}

export function apiUrl(path: string, baseUrl?: string) {
  const urlBase = baseUrl ?? getApiBaseUrls()[0]!;
  return `${urlBase}${path}`;
}

export async function postForm(path: string, form: FormData, token?: string) {
  const errors: string[] = [];
  for (const base of getApiBaseUrls()) {
    try {
      const response = await fetch(apiUrl(path, base), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      if (!response.ok) {
        const payload = await response.text();
        throw new Error(payload || `Upload failed (${response.status})`);
      }
      return response.json();
    } catch (error) {
      errors.push(`${base}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(errors.join(" | "));
}

type JsonRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  timeoutMs?: number;
};

export async function requestJson<T>(path: string, options: JsonRequestOptions = {}) {
  const { method = "GET", body, token, timeoutMs = 20000 } = options;
  const errors: string[] = [];
  for (const base of getApiBaseUrls()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(apiUrl(path, base), {
        method,
        headers: {
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (!response.ok) {
        const payload = await response.text();
        throw new Error(payload || `Request failed (${response.status})`);
      }
      return (await response.json()) as T;
    } catch (error) {
      errors.push(`${base}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(errors.join(" | "));
}

export async function uploadVideoChunk(
  sessionId: string,
  chunkIndex: number,
  chunkBlob: Blob,
  token: string,
) {
  const response = await fetch(apiUrl(`/api/media/videos/sessions/${sessionId}/chunks/${chunkIndex}`), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
    },
    body: chunkBlob,
  });
  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || `Chunk upload failed (${response.status})`);
  }
  return response.json();
}

export type UploadImageResult = { id: string; originalUrl: string };

export async function uploadImage(uri: string, token: string): Promise<UploadImageResult> {
  const form = new FormData();
  const name = uri.split("/").pop() ?? `image-${Date.now()}.jpg`;
  form.append("image", {
    uri,
    name,
    type: "image/jpeg",
  } as unknown as Blob);
  const base = getApiBaseUrls()[0]!;
  const response = await fetch(apiUrl("/api/media/images", base), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || `Image upload failed (${response.status})`);
  }
  return response.json() as Promise<UploadImageResult>;
}
