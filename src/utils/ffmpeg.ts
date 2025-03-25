import { spawnSync } from "child_process";

/**
 * Vérifie si FFmpeg est installé et disponible
 * @returns true si FFmpeg est disponible
 */
export function checkFFmpeg(): boolean {
  try {
    const result = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return result.status === 0;
  } catch (error) {
    return false;
  }
}
