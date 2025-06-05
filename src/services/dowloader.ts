import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import type { DownloadOptions } from "../types";
import { checkFFmpeg } from "../utils/ffmpeg";
import { DownloadProgress } from "../utils/progress";

export class VideoDownloader {
  private readonly progress: DownloadProgress;
  private currentOutputFile: string;

  constructor() {
    this.progress = new DownloadProgress();
    this.currentOutputFile = "";
  }

  /**
   * Télécharge une vidéo à partir d'une URL
   * @param url - URL de la vidéo à télécharger
   * @param options - Options de téléchargement
   * @returns Promise qui se résout avec le chemin du fichier téléchargé
   * @throws Error si le téléchargement échoue
   */
  async downloadVideo(
    url: string,
    options: DownloadOptions = {}
  ): Promise<string> {
    this.validateInputs(url);
    await this.checkDependencies();
    await this.prepareOutputDirectory(options.outputDir);

    const args = this.buildYtDlpArgs(url, options);
    return this.executeDownload(args, options.verbose || false, false) as Promise<string>;
  }

  /**
   * Télécharge une playlist à partir d'une URL
   * @param url - URL de la playlist à télécharger
   * @param options - Options de téléchargement
   * @returns Promise qui se résout lorsque le téléchargement est terminé
   * @throws Error si le téléchargement échoue
   */
  async downloadPlaylist(
    url: string,
    options: DownloadOptions = {}
  ): Promise<void> {
    this.validateInputs(url);
    await this.checkDependencies();
    await this.prepareOutputDirectory(options.outputDir);

    const args = this.buildPlaylistArgs(url, options);
    return this.executeDownload(args, options.verbose || false, true);
  }

  private validateInputs(url: string): void {
    if (!url) {
      throw new Error("URL invalide ou manquante");
    }
  }

  private async checkDependencies(): Promise<void> {
    if (!checkFFmpeg()) {
      throw new Error(
        "FFmpeg n'est pas installé. Installation requise pour fusionner les flux."
      );
    }
  }

  private async prepareOutputDirectory(outputDir = "downloads"): Promise<void> {
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      throw new Error(
        `Impossible de créer le répertoire ${outputDir}: ${error}`
      );
    }
  }

  private buildYtDlpArgs(url: string, options: DownloadOptions): string[] {
    const outputTemplate = path.join(
      options.outputDir || "downloads",
      "%(title)s.%(ext)s"
    );

    let formatString = "";
    const vq = options.videoQuality || options.resolution; // Use videoQuality, fallback to resolution
    const aq = options.audioQuality;

    if (vq === "worst" && aq === "worstaudio") {
      formatString = "worst";
    } else if (vq === "worst") {
      formatString = "worstvideo+bestaudio/worst";
    } else if (aq === "worstaudio") {
      formatString = "bestvideo+worstaudio/best";
    } else {
      let videoFormat = "bv*";
      if (vq && vq !== "best" && /^\d+$/.test(vq)) { // e.g., "1080", "720"
        videoFormat = `bv*[height<=?${vq}]`;
      } else if (vq === "worst") {
        videoFormat = "wv*";
      }


      let audioFormat = "ba*";
      if (aq && aq !== "best" && /k$/.test(aq)) { // e.g., "192k", "128k"
        audioFormat = `ba*[abr>=?${aq.replace('k', '')}]`; // yt-dlp might prefer abr>=? for minimum
      } else if (aq === "worstaudio") {
        audioFormat = "wa*";
      }
      // Ensure we have placeholders if one is 'best' and the other specific
      if (videoFormat === 'bv*' && audioFormat === 'ba*') {
        formatString = 'bestvideo+bestaudio/best';
      } else {
        formatString = `${videoFormat}+${audioFormat}/${videoFormat}/b`; // fallback to best if specific combo not available
      }
    }


    const baseArgs = [
      "--newline",
      "-o",
      outputTemplate,
      "-f",
      formatString,
      "--merge-output-format",
      options.format || "mp4",
      "--console-title",
      url,
    ];
  }

  private buildPlaylistArgs(url: string, options: DownloadOptions): string[] {
    const outputTemplate = path.join(
      options.outputDir || "downloads",
      "%(playlist)s/%(playlist_index)s - %(title)s.%(ext)s"
    );

    // Replicate format string logic from buildYtDlpArgs
    let formatString = "";
    const vq = options.videoQuality || options.resolution;
    const aq = options.audioQuality;

    if (vq === "worst" && aq === "worstaudio") {
      formatString = "worst";
    } else if (vq === "worst") {
      formatString = "worstvideo+bestaudio/worst";
    } else if (aq === "worstaudio") {
      formatString = "bestvideo+worstaudio/best";
    } else {
      let videoFormat = "bv*";
      if (vq && vq !== "best" && /^\d+$/.test(vq)) {
        videoFormat = `bv*[height<=?${vq}]`;
      } else if (vq === "worst") {
        videoFormat = "wv*";
      }

      let audioFormat = "ba*";
      if (aq && aq !== "best" && /k$/.test(aq)) {
        audioFormat = `ba*[abr>=?${aq.replace('k', '')}]`;
      } else if (aq === "worstaudio") {
        audioFormat = "wa*";
      }

      if (videoFormat === 'bv*' && audioFormat === 'ba*') {
        formatString = 'bestvideo+bestaudio/best';
      } else {
        formatString = `${videoFormat}+${audioFormat}/${videoFormat}/b`;
      }
    }

    const args = [
      "--newline",
      "-o",
      outputTemplate,
      "-f",
      formatString,
      "--merge-output-format",
      options.format || "mp4",
      "--console-title",
      "--yes-playlist",
    ];

    // Limiter le nombre de vidéos si spécifié
    if (options.limit && options.limit > 0) {
      args.push("--playlist-items", `1-${options.limit}`);
    }

    args.push(url);
    return args;
  }

  private executeDownload(args: string[], verbose: boolean, isPlaylist: boolean = false): Promise<string | void> {
    this.currentOutputFile = ""; // Reset for each download
    this.progress.start();

    return new Promise((resolve, reject) => {
      const ytdl = spawn("yt-dlp", args);

      ytdl.stdout.on("data", (data) =>
        this.handleStdout(data.toString(), verbose)
      );
      ytdl.stderr.on("data", (data) =>
        this.handleStderr(data.toString(), verbose)
      );

      ytdl.on("close", (code) => {
        this.progress.stop();
        if (code === 0) {
          if (isPlaylist) {
            resolve();
          } else {
            resolve(this.currentOutputFile);
          }
        } else {
          reject(new Error(`Téléchargement échoué avec le code ${code}`));
        }
      });

      ytdl.on("error", (error) => {
        this.progress.stop();
        reject(
          new Error(`Erreur lors du lancement de yt-dlp: ${error.message}`)
        );
      });
    });
  }

  private handleStdout(output: string, verbose: boolean): void {
    if (verbose) {
      console.log(chalk.gray(output.trim()));
    }

    const destinationMatch = output.match(/\[download] Destination: (.+)/);
    if (destinationMatch) {
      this.currentOutputFile = destinationMatch[1];
    }

    // For playlists, yt-dlp might output multiple destination lines.
    // The last one before FFmpeg processing (if any) or completion would be the relevant one for a single video.
    // For playlists, this.currentOutputFile will be overwritten multiple times.
    // This is acceptable if we don't intend to return a specific file path for playlists.

    this.updateProgress(output);
  }

  private handleStderr(output: string, verbose: boolean): void {
    if (verbose) {
      console.error(chalk.red(output.trim()));
    }
  }

  private updateProgress(output: string): void {
    const downloadingMatch = output.match(
      /\[download]\s+(\d+\.\d+)%\s+of\s+~?(\d+\.\d+)([KMG])iB\s+at\s+(\d+\.\d+)([KMG])iB\/s/
    );

    if (downloadingMatch) {
      const percent = parseFloat(downloadingMatch[1]);
      const size = `${downloadingMatch[2]}${downloadingMatch[3]}iB`;
      const speed = `${downloadingMatch[4]}${downloadingMatch[5]}iB/s`;

      this.progress.update({
        percent,
        size,
        speed,
        status: `${size} à ${speed}`,
      });
    } else if (output.includes("[ffmpeg] Merging formats")) {
      this.progress.update({
        percent: 100,
        status: "Fusion des formats...",
      });
    } else if (output.includes("[download] Downloading video")) {
      const videoMatch = output.match(
        /\[download] Downloading video (\d+) of (\d+)/
      );
      if (videoMatch) {
        const current = parseInt(videoMatch[1]);
        const total = parseInt(videoMatch[2]);
        this.progress.update({
          percent: (current / total) * 100,
          status: `Vidéo ${current}/${total}`,
        });
      }
    }
  }
}
