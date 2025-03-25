import { spawn } from "child_process";
import type { VideoInfo, PlaylistInfo } from "../types";

/**
 * Récupère les informations d'une vidéo
 * @param url URL de la vidéo
 * @returns Promise avec les informations de la vidéo
 */
export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const args = ["--dump-json", "--no-playlist", "--skip-download", url];

  return new Promise((resolve, reject) => {
    const ytdl = spawn("yt-dlp", args);
    let data = "";

    ytdl.stdout.on("data", (chunk) => {
      data += chunk.toString();
    });

    ytdl.stderr.on("data", (chunk) => {
      console.error(`Erreur: ${chunk}`);
    });

    ytdl.on("close", (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(data);
          resolve({
            title: info.title,
            duration: info.duration,
            filesize: info.filesize || info.filesize_approx || 0,
            url: info.webpage_url,
          });
        } catch (error) {
          reject(new Error(`Erreur lors du traitement des données: ${error}`));
        }
      } else {
        reject(new Error(`La commande a échoué avec le code ${code}`));
      }
    });
  });
}

/**
 * Récupère les informations d'une playlist
 * @param url URL de la playlist
 * @returns Promise avec les informations de la playlist
 */
export async function getPlaylistInfo(url: string): Promise<PlaylistInfo> {
  const args = [
    "--dump-json",
    "--flat-playlist",
    "--yes-playlist",
    "--skip-download",
    url,
  ];

  return new Promise((resolve, reject) => {
    const ytdl = spawn("yt-dlp", args);
    let data = "";

    ytdl.stdout.on("data", (chunk) => {
      data += chunk.toString();
    });

    ytdl.stderr.on("data", (chunk) => {
      console.error(`Erreur: ${chunk}`);
    });

    ytdl.on("close", (code) => {
      if (code === 0) {
        try {
          const lines = data.trim().split("\n");
          const videos: VideoInfo[] = [];
          let playlistTitle = "";
          let totalSize = 0;
          let totalDuration = 0;

          for (const line of lines) {
            const info = JSON.parse(line);

            // Si c'est une playlist, le premier élément contient souvent les infos de la playlist
            if (!playlistTitle && info.playlist) {
              playlistTitle = info.playlist;
            }

            videos.push({
              title: info.title,
              duration: info.duration || 0,
              filesize: info.filesize || info.filesize_approx || 0,
              url: info.webpage_url || info.url,
            });

            totalDuration += info.duration || 0;
            totalSize += info.filesize || info.filesize_approx || 0;
          }

          resolve({
            title: playlistTitle || "Playlist",
            videoCount: videos.length,
            totalSize,
            totalDuration,
            videos,
          });
        } catch (error) {
          reject(new Error(`Erreur lors du traitement des données: ${error}`));
        }
      } else {
        reject(new Error(`La commande a échoué avec le code ${code}`));
      }
    });
  });
}
