import { prisma } from "../lib/prisma.js";

const jobProgress = new Map<string, number>();

export function getTranscodeProgress(mediaAssetId: string) {
  return jobProgress.get(mediaAssetId) ?? 0;
}

export function enqueueTranscode(mediaAssetId: string) {
  jobProgress.set(mediaAssetId, 5);

  const tick = setInterval(async () => {
    const current = jobProgress.get(mediaAssetId) ?? 0;
    const next = Math.min(current + 20, 95);
    jobProgress.set(mediaAssetId, next);
  }, 800);

  setTimeout(async () => {
    clearInterval(tick);
    jobProgress.set(mediaAssetId, 100);
    await prisma.mediaAsset.update({
      where: { id: mediaAssetId },
      data: {
        uploadJobStatus: "READY",
      },
    });
  }, 4500);
}
