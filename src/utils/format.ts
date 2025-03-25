/**
 * Formate une taille en bytes en format lisible
 * @param bytes Taille en bytes
 * @returns Chaîne formatée
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Formate une durée en secondes en format HH:MM:SS
 * @param seconds Durée en secondes
 * @returns Chaîne formatée
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "Durée inconnue";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
