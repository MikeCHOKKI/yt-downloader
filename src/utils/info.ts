import { spawn } from "child_process";
import type { VideoInfo, PlaylistInfo } from "../types";

/**
 * Nettoie et formate le nom de l'extracteur / plateforme
 */
function formatExtractorName(extractorKey?: string, extractor?: string): string {
  const raw = extractorKey || extractor || "Inconnue (Lien direct)";
  if (/^youtube/i.test(raw)) return "YouTube";
  if (/^tiktok/i.test(raw)) return "TikTok";
  if (/^twitch/i.test(raw)) return "Twitch";
  if (/^twitter|^x/i.test(raw)) return "Twitter (X)";
  if (/^instagram/i.test(raw)) return "Instagram";
  if (/^facebook/i.test(raw)) return "Facebook";
  if (/^reddit/i.test(raw)) return "Reddit";
  if (/^vimeo/i.test(raw)) return "Vimeo";
  if (/^dailymotion/i.test(raw)) return "Dailymotion";
  if (/^soundcloud/i.test(raw)) return "SoundCloud";
  if (/^generic/i.test(raw)) return "Générique (Lien direct / Flux web)";
  return raw;
}

/**
 * Récupère les informations d'une vidéo ou flux média (toute plateforme)
 * @param url URL de la vidéo ou du flux
 * @param cookiesFromBrowser Navigateur source pour les cookies (optionnel)
 * @returns Promise avec les informations de la vidéo
 */
export async function getVideoInfo(
  url: string,
  cookiesFromBrowser?: string
): Promise<VideoInfo> {
  const args = [
    "--js-runtimes",
    "node",
    "--dump-json",
    "--no-playlist",
    "--skip-download",
  ];

  if (cookiesFromBrowser && cookiesFromBrowser !== "none") {
    args.push("--cookies-from-browser", cookiesFromBrowser);
  }

  args.push(url);

  return new Promise((resolve, reject) => {
    const ytdl = spawn("yt-dlp", args);
    let data = "";
    let errorData = "";

    ytdl.stdout.on("data", (chunk) => {
      data += chunk.toString();
    });

    ytdl.stderr.on("data", (chunk) => {
      errorData += chunk.toString();
    });

    ytdl.on("close", (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(data);

          const isLive = Boolean(
            info.is_live ||
              info.live_status === "is_live" ||
              (info.duration === null &&
                info.formats?.some((f: { protocol?: string }) =>
                  f.protocol?.includes("m3u8") || f.protocol?.includes("live")
                ))
          );

          const hasVideo = Boolean(
            (info.vcodec && info.vcodec !== "none") ||
              (info.video_ext && info.video_ext !== "none") ||
              info.formats?.some(
                (f: { vcodec?: string }) => f.vcodec && f.vcodec !== "none"
              )
          );

          const hasAudio = Boolean(
            (info.acodec && info.acodec !== "none") ||
              (info.audio_ext && info.audio_ext !== "none") ||
              info.formats?.some(
                (f: { acodec?: string }) => f.acodec && f.acodec !== "none"
              )
          );

          resolve({
            title: info.title || info.id || "Média sans titre",
            duration: info.duration || 0,
            filesize: info.filesize || info.filesize_approx || 0,
            url: info.webpage_url || info.original_url || url,
            extractor: formatExtractorName(info.extractor_key, info.extractor),
            isLive,
            liveStatus: info.live_status,
            hasVideo,
            hasAudio,
            thumbnail: info.thumbnail,
          });
        } catch (error) {
          reject(new Error(`Erreur lors du traitement des données: ${error}`));
        }
      } else {
        reject(
          new Error(
            errorData.trim() || `La commande a échoué avec le code ${code}`
          )
        );
      }
    });
  });
}

/**
 * Récupère les informations d'une playlist ou d'une chaîne
 * @param url URL de la playlist
 * @param cookiesFromBrowser Navigateur source pour les cookies (optionnel)
 * @returns Promise avec les informations de la playlist
 */
export async function getPlaylistInfo(
  url: string,
  cookiesFromBrowser?: string
): Promise<PlaylistInfo> {
  const args = [
    "--js-runtimes",
    "node",
    "--dump-json",
    "--flat-playlist",
    "--yes-playlist",
    "--skip-download",
  ];

  if (cookiesFromBrowser && cookiesFromBrowser !== "none") {
    args.push("--cookies-from-browser", cookiesFromBrowser);
  }

  args.push(url);

  return new Promise((resolve, reject) => {
    const ytdl = spawn("yt-dlp", args);
    let data = "";
    let errorData = "";

    ytdl.stdout.on("data", (chunk) => {
      data += chunk.toString();
    });

    ytdl.stderr.on("data", (chunk) => {
      errorData += chunk.toString();
    });

    ytdl.on("close", (code) => {
      if (code === 0) {
        try {
          const lines = data.trim().split("\n").filter((l) => l.trim().length > 0);
          const videos: VideoInfo[] = [];
          let playlistTitle = "";
          let rawExtractor = "";
          let totalSize = 0;
          let totalDuration = 0;

          for (const line of lines) {
            try {
              const info = JSON.parse(line);

              if (!playlistTitle && info.playlist) {
                playlistTitle = info.playlist;
              }
              if (!rawExtractor && (info.extractor_key || info.extractor)) {
                rawExtractor = info.extractor_key || info.extractor;
              }

              videos.push({
                title: info.title || "Vidéo sans titre",
                duration: info.duration || 0,
                filesize: info.filesize || info.filesize_approx || 0,
                url: info.webpage_url || info.url || url,
                extractor: formatExtractorName(info.extractor_key, info.extractor),
                isLive: Boolean(info.is_live),
                hasVideo: true,
                hasAudio: true,
              });

              totalDuration += info.duration || 0;
              totalSize += info.filesize || info.filesize_approx || 0;
            } catch {
              // ignorer une ligne JSON malformée
            }
          }

          resolve({
            title: playlistTitle || "Playlist",
            videoCount: videos.length,
            totalSize,
            totalDuration,
            extractor: formatExtractorName(rawExtractor),
            videos,
          });
        } catch (error) {
          reject(new Error(`Erreur lors du traitement des données: ${error}`));
        }
      } else {
        reject(
          new Error(
            errorData.trim() || `La commande a échoué avec le code ${code}`
          )
        );
      }
    });
  });
}
